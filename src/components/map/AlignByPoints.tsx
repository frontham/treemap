'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, type MapLayerMouseEvent, type GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useAlign } from './AlignContext';
import { TREES_SOURCE, TREES_PIN_LAYER } from './treeLayer';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { useRole } from '@/components/auth/useRole';
import {
  applyRigid,
  solveSimilarity,
  metresBetween,
  type RigidParams,
} from '@/lib/geo/rigidTransform';

type CP = { cpId: number; treeId: string; from: [number, number]; to: [number, number] };

const moved = (c: CP) => c.to[0] !== c.from[0] || c.to[1] !== c.from[1];

/**
 * Drag-to-align (admin). Click a pin you know, drag the red handle to its true
 * spot — that's one control point. With 2+ control points it fits a similarity
 * (translate+rotate+scale, robust to a bad drag) and previews it on every tree;
 * Save persists. The whole transform is the same applyRigid math as Save.
 */
export function AlignByPoints() {
  const { map } = useMap();
  const { can } = useRole();
  const { tool, setTool } = useAlign();
  const active = tool === 'points';
  const utils = trpc.useUtils();
  const { data } = trpc.trees.list.useQuery();

  const [previewing, setPreviewing] = useState(false);
  const [cps, setCps] = useState<CP[]>([]);

  const markers = useRef<Map<number, Marker>>(new Map());
  const counter = useRef(0);
  const cpsRef = useRef<CP[]>([]);
  const previewingRef = useRef(false);
  const baseRef = useRef(new Map<string, [number, number]>());
  useEffect(() => {
    cpsRef.current = cps;
  }, [cps]);
  useEffect(() => {
    previewingRef.current = previewing;
  }, [previewing]);

  const pivot = useMemo(() => {
    const feats = data?.features ?? [];
    if (feats.length === 0) return null;
    let sx = 0;
    let sy = 0;
    for (const f of feats) {
      sx += f.geometry.coordinates[0] ?? 0;
      sy += f.geometry.coordinates[1] ?? 0;
    }
    return { lng: sx / feats.length, lat: sy / feats.length };
  }, [data]);

  useEffect(() => {
    const m = new Map<string, [number, number]>();
    for (const f of data?.features ?? []) {
      m.set(f.properties.id as string, [
        f.geometry.coordinates[0] ?? 0,
        f.geometry.coordinates[1] ?? 0,
      ]);
    }
    baseRef.current = m;
  }, [data]);

  // Robust similarity fit from the moved control points.
  const fit = useMemo(() => {
    if (!pivot) return null;
    const pts = cps.filter(moved);
    if (pts.length < 2) return null;
    const resid = (p: RigidParams, c: CP) =>
      metresBetween(applyRigid(c.from[0], c.from[1], p), c.to, pivot.lat);
    let idx = pts.map((_, i) => i);
    let params = solveSimilarity(
      pts.map((c) => c.from),
      pts.map((c) => c.to),
      pivot.lng,
      pivot.lat,
    );
    for (let it = 0; it < 6; it++) {
      params = solveSimilarity(
        idx.map((i) => pts[i]!.from),
        idx.map((i) => pts[i]!.to),
        pivot.lng,
        pivot.lat,
      );
      const sorted = idx.map((i) => resid(params, pts[i]!)).sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
      const keep = pts.map((_, i) => i).filter((i) => resid(params, pts[i]!) < Math.max(3 * med, 2));
      if (keep.length === idx.length || keep.length < 2) break;
      idx = keep;
    }
    params = solveSimilarity(
      idx.map((i) => pts[i]!.from),
      idx.map((i) => pts[i]!.to),
      pivot.lng,
      pivot.lat,
    );
    const residuals = new Map<number, number>();
    for (const c of pts) residuals.set(c.cpId, resid(params, c));
    const inlierIds = new Set(idx.map((i) => pts[i]!.cpId));
    const resVals = idx.map((i) => residuals.get(pts[i]!.cpId) ?? 0).sort((a, b) => a - b);
    return {
      params,
      residuals,
      inlierIds,
      medRes: resVals[Math.floor(resVals.length / 2)] ?? 0,
    };
  }, [cps, pivot]);

  // Preview: push transformed (or original) features into the trees source.
  useEffect(() => {
    if (!map || !data) return;
    const src = map.getSource(TREES_SOURCE) as GeoJSONSource | undefined;
    if (!src) return;
    if (active && previewing && fit) {
      src.setData({
        ...data,
        features: data.features.map((f) => {
          const [lng, lat] = applyRigid(
            f.geometry.coordinates[0] ?? 0,
            f.geometry.coordinates[1] ?? 0,
            fit.params,
          );
          return { ...f, geometry: { ...f.geometry, coordinates: [lng, lat] } };
        }),
      });
    } else {
      src.setData(data);
    }
  }, [map, data, active, previewing, fit]);

  // While active: capture pin clicks to create control points (selection is
  // suppressed because AlignContext.aligning is true → TreeSelectHandler stands down).
  useEffect(() => {
    if (!map || !active) return;
    const onClick = (e: MapLayerMouseEvent) => {
      if (previewingRef.current) return;
      const id = (e.features?.[0]?.properties as { id?: string } | null)?.id;
      if (!id || cpsRef.current.some((c) => c.treeId === id)) return;
      const from = baseRef.current.get(id);
      if (!from) return;
      const cpId = ++counter.current;
      const marker = new Marker({ draggable: true, color: '#e11d48' }).setLngLat(from).addTo(map);
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        setCps((prev) => prev.map((c) => (c.cpId === cpId ? { ...c, to: [ll.lng, ll.lat] } : c)));
      });
      markers.current.set(cpId, marker);
      setCps((prev) => [...prev, { cpId, treeId: id, from, to: [from[0], from[1]] }]);
    };
    const enter = () => {
      if (!previewingRef.current) map.getCanvas().style.cursor = 'crosshair';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
    };
    map.on('click', TREES_PIN_LAYER, onClick);
    map.on('mouseenter', TREES_PIN_LAYER, enter);
    map.on('mouseleave', TREES_PIN_LAYER, leave);
    return () => {
      map.off('click', TREES_PIN_LAYER, onClick);
      map.off('mouseenter', TREES_PIN_LAYER, enter);
      map.off('mouseleave', TREES_PIN_LAYER, leave);
      map.getCanvas().style.cursor = '';
    };
  }, [map, active]);

  const clearAll = () => {
    for (const m of markers.current.values()) m.remove();
    markers.current.clear();
    setCps([]);
  };
  const removeCp = (cpId: number) => {
    markers.current.get(cpId)?.remove();
    markers.current.delete(cpId);
    setCps((prev) => prev.filter((c) => c.cpId !== cpId));
  };

  const calibrate = trpc.trees.calibrate.useMutation({
    onSuccess: () => {
      utils.trees.list.invalidate();
      clearAll();
      setPreviewing(false);
      setTool('none');
    },
  });

  if (!can('admin') || tool !== 'points') return null;

  const movedCount = cps.filter(moved).length;

  return (
    <div className="absolute bottom-4 left-4 z-30 w-80 rounded-lg bg-panel/95 p-3 text-ink shadow-floating hairline backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">Align by points</span>
        <span className="text-xs text-muted">
          {movedCount}/{cps.length} moved
        </span>
      </div>
      <p className="mb-2 text-xs text-muted">
        Click a pin you recognise, then drag its red handle to the correct spot. Do 3+ spread across
        the map, then Preview &amp; Save.
      </p>

      {cps.length > 0 && (
        <ul className="mb-2 max-h-40 space-y-1 overflow-auto text-xs">
          {cps.map((c, i) => {
            const r = fit?.residuals.get(c.cpId);
            const out = !!fit && !fit.inlierIds.has(c.cpId);
            return (
              <li key={c.cpId} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  #{i + 1}
                  {!moved(c) ? <span className="text-muted"> — drag handle</span> : null}
                  {r != null ? (
                    <span className={out ? 'text-danger' : 'text-muted'}>
                      {' '}
                      · {r.toFixed(1)} m{out ? ' (ignored)' : ''}
                    </span>
                  ) : null}
                </span>
                <button
                  onClick={() => removeCp(c.cpId)}
                  className="shrink-0 text-muted hover:text-danger"
                  aria-label="remove control point"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {fit ? (
        <p className="mb-2 text-xs text-muted">
          Fit: {((fit.params.scale - 1) * 100).toFixed(1)}% scale, {fit.params.angleDeg.toFixed(1)}°
          rot · median {fit.medRes.toFixed(1)} m ({fit.inlierIds.size} pts)
        </p>
      ) : (
        <p className="mb-2 text-xs text-muted">Move at least 2 pins to compute a fit.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={previewing ? 'primary' : 'secondary'}
          disabled={!fit}
          onClick={() => setPreviewing((p) => !p)}
        >
          {previewing ? 'Previewing' : 'Preview'}
        </Button>
        <Button
          size="sm"
          disabled={!fit || calibrate.isPending}
          onClick={() => fit && calibrate.mutate(fit.params)}
        >
          {calibrate.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" disabled={cps.length === 0 || calibrate.isPending} onClick={clearAll}>
          Clear
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="ml-auto"
          disabled={calibrate.isPending}
          onClick={() => {
            clearAll();
            setPreviewing(false);
            setTool('none');
          }}
        >
          Close
        </Button>
      </div>
      {calibrate.isError ? (
        <p className="mt-2 text-xs text-danger">Save failed: {calibrate.error.message}</p>
      ) : null}
    </div>
  );
}
