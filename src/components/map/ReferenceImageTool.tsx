'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from './MapContext';
import { useAlign } from './AlignContext';
import { Button } from '@/components/ui/Button';
import { useRole } from '@/components/auth/useRole';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { useDialog } from '@/components/ui/dialog/DialogProvider';
import { applyRigid, solveSimilarity } from '@/lib/geo/rigidTransform';
import {
  corners,
  mPerDegLng,
  transformFromCorners,
  type OverlayTransform,
} from '@/lib/geo/imageOverlay';
import { downscaleToJpeg } from '@/lib/image/processImage';
import {
  addReferenceImage,
  removeReferenceImage,
  setReferenceImageCorners,
  setReferenceImageOpacity,
} from './referenceImage/imageLayer';
import { useTransformHandles } from './referenceImage/useTransformHandles';
import { useFitByPoints } from './referenceImage/useFitByPoints';
import { ReferenceImagePanel } from './referenceImage/ReferenceImagePanel';
import { OpacitySlider } from './referenceImage/OpacitySlider';
import { SubModeTabs, type SubMode } from './referenceImage/SubModeTabs';
import { TransformActions } from './referenceImage/TransformActions';
import { FitActions } from './referenceImage/FitActions';

/**
 * Reference-image overlay (from the Tools menu). Two modes:
 *   - Move/resize: blue dot moves, green dot resizes (rotation locked),
 *     purple dot above the top edge rotates (useTransformHandles).
 *   - Fit by points: click a feature on the image, then its real spot on the
 *     map (useFitByPoints); after 2+, Fit solves a similarity (solveSimilarity)
 *     and snaps the image onto the map.
 * Save overlay persists the image (downscaled) + corners to the overlays table.
 */
export function ReferenceImageTool() {
  const t = useT();
  const toast = useToast();
  const { prompt } = useDialog();
  const { map } = useMap();
  const { can } = useRole();
  const { tool, setTool, editingOverlay } = useAlign();
  const open = tool === 'reference';
  const editId = editingOverlay?.id ?? null;
  const utils = trpc.useUtils();

  const [hasImage, setHasImage] = useState(false);
  // Bumped on every image (re)load so the handles remount on the new transform.
  const [imageVersion, setImageVersion] = useState(0);
  const [opacity, setOpacity] = useState(0.6);
  const [subMode, setSubMode] = useState<SubMode>('transform');

  const transform = useRef<OverlayTransform | null>(null);
  /** Object URL of a freshly chosen file (owned by us; revoked on cleanup). */
  const urlRef = useRef<string | null>(null);
  /** Downscaled data URL to persist on Save/Update. */
  const saveUrlRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedEditId = useRef<string | null>(null);

  const fit = useFitByPoints(map, open && hasImage && subMode === 'points');
  useTransformHandles({
    map,
    active: open && hasImage && subMode === 'transform',
    version: imageVersion,
    transformRef: transform,
    onChange: (cs) => map && setReferenceImageCorners(map, cs),
  });

  const redrawImage = () => {
    if (map && transform.current) setReferenceImageCorners(map, corners(transform.current));
  };

  const showImage = (st: OverlayTransform, url: string, alpha: number) => {
    if (!map) return;
    transform.current = st;
    addReferenceImage(map, url, corners(st), alpha);
    setHasImage(true);
    setImageVersion((v) => v + 1);
  };

  const clearImage = () => {
    if (map) removeReferenceImage(map);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    saveUrlRef.current = null;
    transform.current = null;
    setHasImage(false);
    setSubMode('transform');
  };

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (map) setReferenceImageOpacity(map, opacity);
  }, [map, opacity, hasImage]);

  // Seed the tool from a saved overlay when entering edit mode (from the Layers
  // panel). Rebuilds the editable image + transform state from the stored
  // corners so it behaves exactly like a freshly dropped reference image.
  useEffect(() => {
    if (!map || !open) return;
    if (!editingOverlay) {
      loadedEditId.current = null;
      return;
    }
    if (loadedEditId.current === editingOverlay.id) return;
    loadedEditId.current = editingOverlay.id;

    clearImage(); // drop any prior transient image first
    showImage(transformFromCorners(editingOverlay.corners), editingOverlay.url, editingOverlay.opacityDefault);
    saveUrlRef.current = editingOverlay.url; // reused on Update unless Replace picks a new file
    urlRef.current = null; // not an object URL we own — don't revoke it
    setOpacity(editingOverlay.opacityDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, open, editingOverlay]);

  const doFit = () => {
    const pairs = fit.getPairs();
    if (!transform.current || pairs.length < 2) return;
    const st = transform.current;
    const pivot = st.center;
    const T = solveSimilarity(
      pairs.map((p) => p.from),
      pairs.map((p) => p.to),
      pivot[0],
      pivot[1],
    );
    st.center = applyRigid(pivot[0], pivot[1], T);
    st.scale *= T.scale;
    st.rotDeg += T.angleDeg;
    redrawImage();
    fit.clearPairs();
    setSubMode('transform');
  };

  const loadFile = (file: File) => {
    if (!map) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
      const c = map.getCenter();
      const b = map.getBounds();
      const viewW = (b.getEast() - b.getWest()) * mPerDegLng(c.lat);
      const baseHalfWm = Math.max(20, viewW * 0.3);
      clearImage();
      urlRef.current = url;
      saveUrlRef.current = downscaleToJpeg(img, 2000, 0.85);
      showImage(
        { center: [c.lng, c.lat], scale: 1, rotDeg: 0, baseHalfWm, baseHalfHm: baseHalfWm / aspect },
        url,
        opacity,
      );
    };
    img.src = url;
  };

  const saveOverlay = trpc.overlays.create.useMutation({
    onSuccess: () => {
      utils.overlays.list.invalidate();
      clearImage();
      toast.success(t('refimg.saved'));
    },
    onError: (e) => toast.error(t('common.saveFailed', { message: e.message })),
  });
  const doSave = async () => {
    if (!transform.current || !saveUrlRef.current) return;
    const name = await prompt({
      message: t('refimg.namePrompt'),
      defaultValue: t('tools.reference'),
      confirmLabel: t('common.save'),
    });
    if (!name || !transform.current || !saveUrlRef.current) return;
    saveOverlay.mutate({
      name,
      storageKey: saveUrlRef.current,
      corners: corners(transform.current).map(([lng, lat]) => ({ lng, lat })),
      opacityDefault: opacity,
    });
  };

  const updateOverlay = trpc.overlays.update.useMutation({
    onSuccess: () => {
      utils.overlays.list.invalidate();
      clearImage();
      setTool('none'); // closes the panel + clears editingOverlay → loader redraws at new corners
    },
    onError: (e) => toast.error(t('refimg.updateFailed', { message: e.message })),
  });
  const doUpdate = () => {
    if (!transform.current || !editId) return;
    // Only resend the (potentially large) image when it was actually replaced.
    const replaced = !!saveUrlRef.current && saveUrlRef.current !== editingOverlay?.url;
    updateOverlay.mutate({
      id: editId,
      storageKey: replaced ? saveUrlRef.current ?? undefined : undefined,
      corners: corners(transform.current).map(([lng, lat]) => ({ lng, lat })),
      opacityDefault: opacity,
    });
  };
  const cancelEdit = () => {
    clearImage();
    setTool('none'); // clears editingOverlay → loader restores the original overlay unchanged
  };
  const closePanel = () => {
    if (editId) clearImage(); // editing: discard the editable copy so no duplicate lingers
    setTool('none');
  };

  if (!can('editor') || !open) return null;

  return (
    <ReferenceImagePanel
      title={
        editId ? t('refimg.editTitle', { name: editingOverlay?.name ?? '' }) : t('tools.reference')
      }
      onClose={closePanel}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) loadFile(f);
          e.target.value = '';
        }}
      />

      {!hasImage ? (
        <>
          <Button size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
            {t('refimg.choose')}
          </Button>
          <p className="mt-2 text-xs text-muted">{t('refimg.chooseHint')}</p>
        </>
      ) : (
        <>
          <OpacitySlider value={opacity} onChange={setOpacity} />
          <SubModeTabs
            value={subMode}
            onChange={(m) => {
              if (m === 'transform') fit.clearPairs();
              setSubMode(m);
            }}
          />
          {subMode === 'transform' ? (
            <TransformActions
              editing={!!editId}
              pending={editId ? updateOverlay.isPending : saveOverlay.isPending}
              onCommit={editId ? doUpdate : doSave}
              onReplace={() => fileRef.current?.click()}
              onDiscard={editId ? cancelEdit : clearImage}
            />
          ) : (
            <FitActions
              pairCount={fit.pairCount}
              hasPending={!!fit.pendingRef.current}
              onFit={doFit}
              onClear={fit.clearPairs}
            />
          )}
        </>
      )}
    </ReferenceImagePanel>
  );
}
