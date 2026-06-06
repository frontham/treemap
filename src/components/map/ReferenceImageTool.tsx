'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, type ImageSource, type GeoJSONSource, type MapMouseEvent } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useAlign } from './AlignContext';
import { TREES_CLUSTER_LAYER } from './treeLayer';
import { Button } from '@/components/ui/Button';
import { useRole } from '@/components/auth/useRole';
import { trpc } from '@/lib/trpc/client';
import { applyRigid, solveSimilarity } from '@/lib/geo/rigidTransform';

const SRC = 'ref-image';
const LYR = 'ref-image-layer';
const FIT_SRC = 'ref-fit';
const FIT_LINE = 'ref-fit-line';
const FIT_PT = 'ref-fit-pt';
const M_PER_DEG_LAT = 111_320;

type State = {
  center: [number, number];
  scale: number;
  rotDeg: number;
  baseHalfWm: number;
  baseHalfHm: number;
};
type Pt = [number, number];
type Pair = { from: Pt; to: Pt };
type LngLatCorners = [Pt, Pt, Pt, Pt];

function corners(st: State): LngLatCorners {
  const mLng = M_PER_DEG_LAT * Math.cos((st.center[1] * Math.PI) / 180);
  const hw = st.baseHalfWm * st.scale;
  const hh = st.baseHalfHm * st.scale;
  const th = (st.rotDeg * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const local: Pt[] = [
    [-hw, hh],
    [hw, hh],
    [hw, -hh],
    [-hw, -hh],
  ];
  return local.map(([x, y]) => {
    const rx = x * c - y * s;
    const ry = x * s + y * c;
    return [st.center[0] + rx / mLng, st.center[1] + ry / M_PER_DEG_LAT] as Pt;
  }) as LngLatCorners;
}

/**
 * Inverse of `corners()`: rebuild an editable State from a saved overlay's four
 * lng/lat corners ([TL, TR, BR, BL]) so a stored overlay can be moved/resized
 * exactly like a freshly dropped image. baseHalf*m carry the on-map dimensions
 * with scale reset to 1, so the resize handle keeps the stored aspect ratio.
 */
type LatLng = { lng: number; lat: number };
function stateFromCorners(cs: readonly [LatLng, LatLng, LatLng, LatLng]): State {
  const [tl, tr, br, bl] = cs;
  const centerLng = (tl.lng + br.lng) / 2;
  const centerLat = (tl.lat + br.lat) / 2;
  const mLng = M_PER_DEG_LAT * Math.cos((centerLat * Math.PI) / 180);
  const toM = (p: { lng: number; lat: number }): Pt => [
    (p.lng - centerLng) * mLng,
    (p.lat - centerLat) * M_PER_DEG_LAT,
  ];
  const tlM = toM(tl);
  const trM = toM(tr);
  const blM = toM(bl);
  const widthAxis: Pt = [trM[0] - tlM[0], trM[1] - tlM[1]]; // R(rot)·(2·halfW, 0)
  const heightAxis: Pt = [tlM[0] - blM[0], tlM[1] - blM[1]]; // R(rot)·(0, 2·halfH)
  const baseHalfWm = Math.max(1, Math.hypot(widthAxis[0], widthAxis[1]) / 2);
  const baseHalfHm = Math.max(1, Math.hypot(heightAxis[0], heightAxis[1]) / 2);
  const rotDeg = (Math.atan2(widthAxis[1], widthAxis[0]) * 180) / Math.PI;
  return { center: [centerLng, centerLat], scale: 1, rotDeg, baseHalfWm, baseHalfHm };
}

/** Rotate-handle position: 25% beyond the top-edge midpoint, along the image's up-axis (so it tracks rotation + size). */
function rotateHandlePos(st: State): Pt {
  const cs = corners(st);
  const topMidLng = (cs[0][0] + cs[1][0]) / 2;
  const topMidLat = (cs[0][1] + cs[1][1]) / 2;
  return [
    st.center[0] + (topMidLng - st.center[0]) * 1.25,
    st.center[1] + (topMidLat - st.center[1]) * 1.25,
  ];
}

function dot(color: string, cursor: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `width:15px;height:15px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35);cursor:${cursor}`;
  return el;
}

function downscale(img: HTMLImageElement, maxDim = 2000, quality = 0.85): string {
  const f = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * f));
  const h = Math.max(1, Math.round(img.naturalHeight * f));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

function fitFC(pairs: Pair[], pending: Pt | null) {
  const features: GeoJSON.Feature[] = [];
  for (const p of pairs) {
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [p.from, p.to] }, properties: { role: 'line' } });
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: p.from }, properties: { role: 'from' } });
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: p.to }, properties: { role: 'to' } });
  }
  if (pending) features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pending }, properties: { role: 'from' } });
  return { type: 'FeatureCollection' as const, features };
}

/**
 * Reference-image overlay (from the Tools menu). Two modes:
 *   - Move/resize: blue dot moves, green dot resizes (rotation locked),
 *     purple dot above the top edge rotates.
 *   - Fit by points: click a feature on the image, then its real spot on the
 *     map (a from→to pair); after 2+, Fit solves a similarity (solveSimilarity)
 *     and snaps the image onto the map.
 * Save overlay persists the image (downscaled) + corners to the overlays table.
 */
export function ReferenceImageTool() {
  const { map } = useMap();
  const { can } = useRole();
  const { tool, setTool, setCapturingPoints, editingOverlay } = useAlign();
  const open = tool === 'reference';
  const editId = editingOverlay?.id ?? null;
  const utils = trpc.useUtils();

  const [hasImage, setHasImage] = useState(false);
  const [opacity, setOpacity] = useState(0.6);
  const [subMode, setSubMode] = useState<'transform' | 'points'>('transform');
  const [pairCount, setPairCount] = useState(0);

  const st = useRef<State | null>(null);
  const centerMk = useRef<Marker | null>(null);
  const trMk = useRef<Marker | null>(null);
  const rotMk = useRef<Marker | null>(null);
  const urlRef = useRef<string | null>(null);
  const saveUrlRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pairsRef = useRef<Pair[]>([]);
  const pendingRef = useRef<Pt | null>(null);
  const loadedEditId = useRef<string | null>(null);

  const redraw = (skip?: 'center' | 'tr' | 'rot') => {
    if (!map || !st.current) return;
    const cs = corners(st.current);
    (map.getSource(SRC) as ImageSource | undefined)?.setCoordinates(cs);
    if (skip !== 'center') centerMk.current?.setLngLat(st.current.center);
    if (skip !== 'tr') trMk.current?.setLngLat(cs[1]);
    if (skip !== 'rot') rotMk.current?.setLngLat(rotateHandlePos(st.current));
  };

  const removeMarkers = () => {
    centerMk.current?.remove();
    trMk.current?.remove();
    rotMk.current?.remove();
    centerMk.current = null;
    trMk.current = null;
    rotMk.current = null;
  };

  const updateFitSource = () => {
    (map?.getSource(FIT_SRC) as GeoJSONSource | undefined)?.setData(
      fitFC(pairsRef.current, pendingRef.current),
    );
  };
  const clearPairs = () => {
    pairsRef.current = [];
    pendingRef.current = null;
    setPairCount(0);
    updateFitSource();
  };

  const clearImage = () => {
    removeMarkers();
    if (map?.getLayer(LYR)) map.removeLayer(LYR);
    if (map?.getSource(SRC)) map.removeSource(SRC);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    saveUrlRef.current = null;
    st.current = null;
    setHasImage(false);
    setSubMode('transform');
  };

  useEffect(
    () => () => {
      removeMarkers();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (map?.getLayer(LYR)) map.setPaintProperty(LYR, 'raster-opacity', opacity);
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
    const seeded = stateFromCorners(editingOverlay.corners);
    st.current = seeded;
    saveUrlRef.current = editingOverlay.url; // reused on Update unless Replace picks a new file
    urlRef.current = null; // not an object URL we own — don't revoke it
    setOpacity(editingOverlay.opacityDefault);
    map.addSource(SRC, { type: 'image', url: editingOverlay.url, coordinates: corners(seeded) });
    const before = map.getLayer(TREES_CLUSTER_LAYER) ? TREES_CLUSTER_LAYER : undefined;
    map.addLayer(
      {
        id: LYR,
        type: 'raster',
        source: SRC,
        paint: { 'raster-opacity': editingOverlay.opacityDefault, 'raster-fade-duration': 0 },
      },
      before,
    );
    setHasImage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, open, editingOverlay]);

  // Move/resize handles — only in transform mode while the panel is open.
  useEffect(() => {
    if (!map) return;
    removeMarkers();
    if (open && hasImage && subMode === 'transform' && st.current) {
      const cs = corners(st.current);
      const cm = new Marker({ element: dot('#2563eb', 'move'), draggable: true, anchor: 'center' })
        .setLngLat(st.current.center)
        .addTo(map);
      cm.on('drag', () => {
        if (!st.current) return;
        const ll = cm.getLngLat();
        st.current.center = [ll.lng, ll.lat];
        redraw('center');
      });
      // Green corner: resize only (uniform scale, rotation locked). The handle
      // stays glued to the corner, so dragging just grows/shrinks the box.
      const tm = new Marker({ element: dot('#16a34a', 'nwse-resize'), draggable: true, anchor: 'center' })
        .setLngLat(cs[1])
        .addTo(map);
      tm.on('drag', () => {
        if (!st.current) return;
        const ll = tm.getLngLat();
        const mLng = M_PER_DEG_LAT * Math.cos((st.current.center[1] * Math.PI) / 180);
        const px = (ll.lng - st.current.center[0]) * mLng;
        const py = (ll.lat - st.current.center[1]) * M_PER_DEG_LAT;
        st.current.scale = Math.max(
          0.02,
          Math.hypot(px, py) / Math.hypot(st.current.baseHalfWm, st.current.baseHalfHm),
        );
        redraw();
      });

      // Purple handle above the top edge: rotate only (scale kept). Aligns the
      // image's up-axis to the pointer, like grabbing a clock hand.
      const rm = new Marker({ element: dot('#9333ea', 'grab'), draggable: true, anchor: 'center' })
        .setLngLat(rotateHandlePos(st.current))
        .addTo(map);
      rm.on('drag', () => {
        if (!st.current) return;
        const ll = rm.getLngLat();
        const mLng = M_PER_DEG_LAT * Math.cos((st.current.center[1] * Math.PI) / 180);
        const px = (ll.lng - st.current.center[0]) * mLng;
        const py = (ll.lat - st.current.center[1]) * M_PER_DEG_LAT;
        st.current.rotDeg = (Math.atan2(py, px) * 180) / Math.PI - 90;
        redraw();
      });

      centerMk.current = cm;
      trMk.current = tm;
      rotMk.current = rm;
    }
    return removeMarkers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, open, hasImage, subMode]);

  // Fit-by-points capture — click image feature, then its real spot on the map.
  useEffect(() => {
    if (!map || !open || !hasImage || subMode !== 'points') return;
    setCapturingPoints(true);
    if (!map.getSource(FIT_SRC)) {
      map.addSource(FIT_SRC, { type: 'geojson', data: fitFC([], null) });
      map.addLayer({
        id: FIT_LINE,
        type: 'line',
        source: FIT_SRC,
        filter: ['==', ['get', 'role'], 'line'],
        paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-dasharray': [2, 1] },
      });
      map.addLayer({
        id: FIT_PT,
        type: 'circle',
        source: FIT_SRC,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': ['match', ['get', 'role'], 'from', '#f59e0b', 'to', '#16a34a', '#999'],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
        },
      });
    }
    updateFitSource();
    const onClick = (e: MapMouseEvent) => {
      const ll: Pt = [e.lngLat.lng, e.lngLat.lat];
      if (!pendingRef.current) {
        pendingRef.current = ll;
      } else {
        pairsRef.current = [...pairsRef.current, { from: pendingRef.current, to: ll }];
        pendingRef.current = null;
        setPairCount(pairsRef.current.length);
      }
      updateFitSource();
    };
    map.on('click', onClick);
    map.getCanvas().style.cursor = 'crosshair';
    return () => {
      map.off('click', onClick);
      map.getCanvas().style.cursor = '';
      setCapturingPoints(false);
      if (map.getLayer(FIT_PT)) map.removeLayer(FIT_PT);
      if (map.getLayer(FIT_LINE)) map.removeLayer(FIT_LINE);
      if (map.getSource(FIT_SRC)) map.removeSource(FIT_SRC);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, open, hasImage, subMode]);

  const doFit = () => {
    if (!st.current || pairsRef.current.length < 2) return;
    const pivot = st.current.center;
    const T = solveSimilarity(
      pairsRef.current.map((p) => p.from),
      pairsRef.current.map((p) => p.to),
      pivot[0],
      pivot[1],
    );
    st.current.center = applyRigid(pivot[0], pivot[1], T);
    st.current.scale *= T.scale;
    st.current.rotDeg += T.angleDeg;
    redraw();
    clearPairs();
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
      const viewW = (b.getEast() - b.getWest()) * M_PER_DEG_LAT * Math.cos((c.lat * Math.PI) / 180);
      const baseHalfWm = Math.max(20, viewW * 0.3);
      clearImage();
      urlRef.current = url;
      saveUrlRef.current = downscale(img);
      st.current = { center: [c.lng, c.lat], scale: 1, rotDeg: 0, baseHalfWm, baseHalfHm: baseHalfWm / aspect };
      map.addSource(SRC, { type: 'image', url, coordinates: corners(st.current) });
      const before = map.getLayer(TREES_CLUSTER_LAYER) ? TREES_CLUSTER_LAYER : undefined;
      map.addLayer(
        { id: LYR, type: 'raster', source: SRC, paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 } },
        before,
      );
      setHasImage(true);
    };
    img.src = url;
  };

  const saveOverlay = trpc.overlays.create.useMutation({
    onSuccess: () => {
      utils.overlays.list.invalidate();
      clearImage();
      window.alert('Saved. It is now in the Layers panel (bottom-right).');
    },
    onError: (e) => window.alert(`Save failed: ${e.message}`),
  });
  const doSave = () => {
    if (!st.current || !saveUrlRef.current) return;
    const name = window.prompt('Name this overlay', 'Reference image');
    if (!name) return;
    saveOverlay.mutate({
      name,
      storageKey: saveUrlRef.current,
      corners: corners(st.current).map(([lng, lat]) => ({ lng, lat })),
      opacityDefault: opacity,
    });
  };

  const updateOverlay = trpc.overlays.update.useMutation({
    onSuccess: () => {
      utils.overlays.list.invalidate();
      clearImage();
      setTool('none'); // closes the panel + clears editingOverlay → loader redraws at new corners
    },
    onError: (e) => window.alert(`Update failed: ${e.message}`),
  });
  const doUpdate = () => {
    if (!st.current || !editId) return;
    // Only resend the (potentially large) image when it was actually replaced.
    const replaced = !!saveUrlRef.current && saveUrlRef.current !== editingOverlay?.url;
    updateOverlay.mutate({
      id: editId,
      storageKey: replaced ? saveUrlRef.current ?? undefined : undefined,
      corners: corners(st.current).map(([lng, lat]) => ({ lng, lat })),
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
    <div className="absolute bottom-4 left-4 z-30 w-72 rounded-lg bg-panel/95 p-3 text-ink shadow-floating hairline backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="truncate pr-2 text-sm font-medium">
          {editId ? `Edit: ${editingOverlay?.name}` : 'Reference image'}
        </span>
        <button onClick={closePanel} className="shrink-0 text-muted hover:text-ink" aria-label="Close">
          ✕
        </button>
      </div>

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
            Choose image…
          </Button>
          <p className="mt-2 text-xs text-muted">
            Pick a screenshot (e.g. satellite). It drops on the map under the pins.
          </p>
        </>
      ) : (
        <>
          <label className="mb-2 block">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted">Opacity</span>
              <span className="tabular-nums">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="h-1.5 w-full accent-accent"
            />
          </label>

          <div className="mb-2 grid grid-cols-2 gap-1 rounded bg-paper p-0.5 hairline">
            <button
              onClick={() => {
                clearPairs();
                setSubMode('transform');
              }}
              className={`rounded px-2 py-1 text-xs ${subMode === 'transform' ? 'bg-panel font-medium text-ink' : 'text-muted'}`}
            >
              Move / resize
            </button>
            <button
              onClick={() => setSubMode('points')}
              className={`rounded px-2 py-1 text-xs ${subMode === 'points' ? 'bg-panel font-medium text-ink' : 'text-muted'}`}
            >
              Fit by points
            </button>
          </div>

          {subMode === 'transform' ? (
            <>
              <p className="mb-2 text-xs text-muted">
                Drag <span className="font-medium text-[#2563eb]">blue</span> to move,{' '}
                <span className="font-medium text-[#16a34a]">green</span> to resize,{' '}
                <span className="font-medium text-[#9333ea]">purple</span> to rotate.
              </p>
              {editId ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={doUpdate} disabled={updateOverlay.isPending}>
                    {updateOverlay.isPending ? 'Updating…' : 'Update overlay'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                    Replace
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={doSave} disabled={saveOverlay.isPending}>
                    {saveOverlay.isPending ? 'Saving…' : 'Save overlay'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                    Replace
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearImage}>
                    Remove
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted">
                Click a feature on the <span className="font-medium text-[#f59e0b]">image</span>, then
                the same spot on the <span className="font-medium text-[#16a34a]">map</span>. Repeat
                2–3× across the area, then Fit.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={doFit} disabled={pairCount < 2}>
                  Fit ({pairCount})
                </Button>
                <Button size="sm" variant="ghost" onClick={clearPairs} disabled={pairCount === 0 && !pendingRef.current}>
                  Clear points
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
