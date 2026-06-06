'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { TREES_SOURCE } from './treeLayer';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { useRole } from '@/components/auth/useRole';
import { useAlign } from './AlignContext';
import { applyRigid, isIdentity } from '@/lib/geo/rigidTransform';

/**
 * Manual re-georeferencing tool (admin only). Lets you nudge the WHOLE tree
 * layer East/West + North/South (metres) and rotate it about its centroid,
 * with a live preview on the map, then persist with Save. Rotation pivot is the
 * tree-set centroid; the same math runs on the server so Save == preview.
 */
export function CalibratePanel() {
  const { map } = useMap();
  const { can } = useRole();
  const utils = trpc.useUtils();
  const { data } = trpc.trees.list.useQuery();
  const { tool, setTool } = useAlign();
  const active = tool === 'sliders';

  const [dx, setDx] = useState(0); // east(+)/west(−) metres
  const [dy, setDy] = useState(0); // north(+)/south(−) metres
  const [deg, setDeg] = useState(0); // CCW degrees
  const [scalePct, setScalePct] = useState(0); // % size change (0 = unchanged)
  const scale = 1 + scalePct / 100;

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

  // Live preview: push transformed (or original) features into the trees source.
  useEffect(() => {
    if (!map || !data) return;
    const src = map.getSource(TREES_SOURCE) as GeoJSONSource | undefined;
    if (!src) return;
    if (!active || !pivot || isIdentity({ dx, dy, angleDeg: deg, scale })) {
      src.setData(data);
      return;
    }
    const params = { dx, dy, angleDeg: deg, scale, pivotLng: pivot.lng, pivotLat: pivot.lat };
    src.setData({
      ...data,
      features: data.features.map((f) => {
        const [lng, lat] = applyRigid(
          f.geometry.coordinates[0] ?? 0,
          f.geometry.coordinates[1] ?? 0,
          params,
        );
        return { ...f, geometry: { ...f.geometry, coordinates: [lng, lat] } };
      }),
    });
  }, [map, data, active, dx, dy, deg, scale, pivot]);

  const calibrate = trpc.trees.calibrate.useMutation({
    onSuccess: () => {
      utils.trees.list.invalidate();
      setDx(0);
      setDy(0);
      setDeg(0);
      setScalePct(0);
      setTool('none');
    },
  });

  if (!can('admin') || tool !== 'sliders') return null;

  const reset = () => {
    setDx(0);
    setDy(0);
    setDeg(0);
    setScalePct(0);
  };
  const cancel = () => {
    reset();
    setTool('none');
  };
  const save = () => {
    if (!pivot) return;
    calibrate.mutate({ dx, dy, angleDeg: deg, scale, pivotLng: pivot.lng, pivotLat: pivot.lat });
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 w-72 rounded-lg bg-panel/95 p-3 text-ink shadow-floating hairline backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Calibrate trees</span>
        <span className="text-xs text-muted">{data?.features.length ?? 0} pins</span>
      </div>

      <AxisControl
        label="East ← → West"
        value={dx}
        unit="m"
        min={-100}
        max={100}
        step={0.5}
        nudge={1}
        onChange={setDx}
      />
      <AxisControl
        label="North ↑ ↓ South"
        value={dy}
        unit="m"
        min={-100}
        max={100}
        step={0.5}
        nudge={1}
        onChange={setDy}
      />
      <AxisControl
        label="Rotate ↺ ↻"
        value={deg}
        unit="°"
        min={-20}
        max={20}
        step={0.1}
        nudge={0.5}
        onChange={setDeg}
      />
      <AxisControl
        label="Zoom (scale)"
        value={scalePct}
        unit="%"
        min={-15}
        max={15}
        step={0.1}
        nudge={0.5}
        onChange={setScalePct}
      />

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={calibrate.isPending || isIdentity({ dx, dy, angleDeg: deg, scale })}>
          {calibrate.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} disabled={calibrate.isPending}>
          Reset
        </Button>
        <Button size="sm" variant="secondary" onClick={cancel} disabled={calibrate.isPending} className="ml-auto">
          Close
        </Button>
      </div>
      {calibrate.isError ? (
        <p className="mt-2 text-xs text-danger">Save failed: {calibrate.error.message}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        Drag to align the pins to the basemap, then Save. Rotation is about the set&apos;s centre. Reversible.
      </p>
    </div>
  );
}

function AxisControl({
  label,
  value,
  unit,
  min,
  max,
  step,
  nudge,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  nudge: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums">
          {value > 0 ? '+' : ''}
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="h-6 w-6 shrink-0 rounded hairline text-ink hover:bg-paper"
          onClick={() => onChange(clamp(value - nudge))}
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full accent-accent"
        />
        <button
          type="button"
          className="h-6 w-6 shrink-0 rounded hairline text-ink hover:bg-paper"
          onClick={() => onChange(clamp(value + nudge))}
          aria-label={`increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
