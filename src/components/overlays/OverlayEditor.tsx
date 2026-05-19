'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { CloseIcon } from '@/components/icons';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { trpc } from '@/lib/trpc/client';
import { OverlayCornerImage, type Corner } from './OverlayCornerImage';
import { OverlayMiniMap } from './OverlayMiniMap';

type LngLat = { lng: number; lat: number };

const ORDER: Corner[] = ['tl', 'tr', 'br', 'bl'];

const LABEL: Record<Corner, string> = {
  tl: 'top-left',
  tr: 'top-right',
  br: 'bottom-right',
  bl: 'bottom-left',
};

type Props = { open: boolean; onClose: () => void };

/**
 * Two-pane corner picker. Left: image with corner dots. Right: a mini map.
 * The user clicks the four points on the map in TL → TR → BR → BL order,
 * and saves an overlay anchored to those four GPS coords.
 */
export function OverlayEditor({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [corners, setCorners] = useState<Partial<Record<Corner, LngLat>>>({});

  const utils = trpc.useUtils();
  const createOverlay = trpc.overlays.create.useMutation({
    onSuccess: () => {
      utils.overlays.list.invalidate();
      handleClose();
    },
  });

  function reset() {
    setName('');
    setImageUrl('');
    setCorners({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  const next = ORDER.find((c) => !corners[c]) ?? 'tl';
  const placedCount = ORDER.filter((c) => corners[c]).length;
  const allSet = placedCount === 4;
  const canSave = allSet && imageUrl.length > 0 && name.length > 0;

  const handleMapClick = (loc: LngLat) => {
    if (allSet) return;
    setCorners((prev) => ({ ...prev, [next]: loc }));
  };

  const handleSave = () => {
    if (!canSave) return;
    createOverlay.mutate({
      name,
      storageKey: imageUrl,
      corners: ORDER.map((c) => corners[c]!),
    });
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-hairline p-4">
          <div>
            <h2 className="text-lg font-medium tracking-tight">Add overlay</h2>
            <p className="mt-0.5 text-xs text-muted">
              {allSet
                ? 'All four corners set — review and save.'
                : `Click the ${LABEL[next]} corner on the map · `}
              <span className="mono-num">{placedCount}/4</span>
            </p>
          </div>
          <IconButton label="Close" onClick={handleClose}>
            <CloseIcon size={16} />
          </IconButton>
        </header>

        <div className="grid flex-1 grid-cols-2 overflow-hidden">
          <OverlayCornerImage
            imageUrl={imageUrl}
            corners={corners}
            current={next}
          />
          <OverlayMiniMap onMapClick={handleMapClick} markers={cornersToMarkers(corners)} />
        </div>

        <footer className="grid grid-cols-[1fr_auto] items-end gap-4 border-t border-hairline p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Site plan A"
                className={inputBase}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Image URL
              </span>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={inputBase}
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!canSave}>
              Save
            </Button>
          </div>
        </footer>
      </div>
    </Modal>
  );
}

function cornersToMarkers(corners: Partial<Record<Corner, LngLat>>) {
  return ORDER.flatMap((c, i) => {
    const pt = corners[c];
    return pt ? [{ lng: pt.lng, lat: pt.lat, label: String(i + 1) }] : [];
  });
}
