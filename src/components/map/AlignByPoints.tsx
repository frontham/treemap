'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useAlign } from './AlignContext';
import { TREES_SOURCE } from './treeLayer';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { useRole } from '@/components/auth/useRole';
import { applyRigid, solveRobustSimilarity } from '@/lib/geo/rigidTransform';
import { useControlPoints, movedCp, type ControlPoint } from './useControlPoints';

/**
 * Drag-to-align (admin). Click a pin you know, drag the red handle to its true
 * spot — that's one control point. With 2+ control points it fits a similarity
 * (translate+rotate+scale, robust to a bad drag — solveRobustSimilarity) and
 * previews it on every tree; Save persists. The whole transform is the same
 * applyRigid math as Save.
 */
export function AlignByPoints() {
  const { map } = useMap();
  const { can } = useRole();
  const { tool, setTool } = useAlign();
  const active = tool === 'points';
  const utils = trpc.useUtils();
  const { data } = trpc.trees.list.useQuery();

  const [previewing, setPreviewing] = useState(false);

  const baseRef = useRef(new Map<string, [number, number]>());
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

  const { cps, removeCp, clearAll } = useControlPoints({
    map,
    active,
    suppressed: previewing,
    getBase: (id) => baseRef.current.get(id),
  });

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

  // Robust similarity fit from the moved control points, keyed back to cpIds.
  const fit = useMemo(() => {
    if (!pivot) return null;
    const pts = cps.filter(movedCp);
    const result = solveRobustSimilarity(
      pts.map((c) => c.from),
      pts.map((c) => c.to),
      pivot.lng,
      pivot.lat,
    );
    if (!result) return null;
    const residuals = new Map<number, number>();
    pts.forEach((c, i) => residuals.set(c.cpId, result.residuals[i] ?? 0));
    const inlierIds = new Set(pts.filter((_, i) => result.inliers.has(i)).map((c) => c.cpId));
    return { params: result.params, residuals, inlierIds, medRes: result.medianResidual };
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

  const calibrate = trpc.trees.calibrate.useMutation({
    onSuccess: () => {
      utils.trees.list.invalidate();
      clearAll();
      setPreviewing(false);
      setTool('none');
    },
  });

  if (!can('admin') || tool !== 'points') return null;

  const movedCount = cps.filter(movedCp).length;

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
          {cps.map((c, i) => (
            <ControlPointRow
              key={c.cpId}
              cp={c}
              index={i}
              residual={fit?.residuals.get(c.cpId)}
              outlier={!!fit && !fit.inlierIds.has(c.cpId)}
              onRemove={() => removeCp(c.cpId)}
            />
          ))}
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

/** One row in the control-point list: status, residual, and a remove button. */
function ControlPointRow({
  cp,
  index,
  residual,
  outlier,
  onRemove,
}: {
  cp: ControlPoint;
  index: number;
  residual: number | undefined;
  outlier: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="truncate">
        #{index + 1}
        {!movedCp(cp) ? <span className="text-muted"> — drag handle</span> : null}
        {residual != null ? (
          <span className={outlier ? 'text-danger' : 'text-muted'}>
            {' '}
            · {residual.toFixed(1)} m{outlier ? ' (ignored)' : ''}
          </span>
        ) : null}
      </span>
      <button
        onClick={onRemove}
        className="shrink-0 text-muted hover:text-danger"
        aria-label="remove control point"
      >
        ✕
      </button>
    </li>
  );
}
