'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, type Map as MapLibreMap, type MapLayerMouseEvent } from 'maplibre-gl';
import { TREES_PIN_LAYER } from './treeLayer';

type Pt = [number, number];

export type ControlPoint = { cpId: number; treeId: string; from: Pt; to: Pt };

/** A control point counts once its handle has actually been dragged somewhere. */
export const movedCp = (c: ControlPoint) => c.to[0] !== c.from[0] || c.to[1] !== c.from[1];

type Args = {
  map: MapLibreMap | null;
  /** Capture pin clicks while true (the align tool is open). */
  active: boolean;
  /** Pause capture (e.g. while previewing the fit) without dropping the markers. */
  suppressed: boolean;
  /** Resolve a clicked tree id to its base position. */
  getBase: (treeId: string) => Pt | undefined;
};

/**
 * Control-point capture for drag-to-align: clicking a pin drops a draggable
 * red handle at the tree's position; dragging it records where that tree
 * should be (a from→to pair). One control point per tree.
 */
export function useControlPoints({ map, active, suppressed, getBase }: Args) {
  const [cps, setCps] = useState<ControlPoint[]>([]);
  const markers = useRef<Map<number, Marker>>(new Map());
  const counter = useRef(0);
  const cpsRef = useRef<ControlPoint[]>([]);
  const getBaseRef = useRef(getBase);
  useEffect(() => {
    cpsRef.current = cps;
  }, [cps]);
  getBaseRef.current = getBase;

  useEffect(() => {
    if (!map || !active || suppressed) return;
    const onClick = (e: MapLayerMouseEvent) => {
      const id = (e.features?.[0]?.properties as { id?: string } | null)?.id;
      if (!id || cpsRef.current.some((c) => c.treeId === id)) return;
      const from = getBaseRef.current(id);
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
      map.getCanvas().style.cursor = 'crosshair';
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
  }, [map, active, suppressed]);

  const removeCp = (cpId: number) => {
    markers.current.get(cpId)?.remove();
    markers.current.delete(cpId);
    setCps((prev) => prev.filter((c) => c.cpId !== cpId));
  };

  const clearAll = () => {
    for (const m of markers.current.values()) m.remove();
    markers.current.clear();
    setCps([]);
  };

  return { cps, removeCp, clearAll };
}
