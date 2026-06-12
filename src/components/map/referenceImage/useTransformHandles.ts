'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { Marker, type Map as MapLibreMap } from 'maplibre-gl';
import {
  corners,
  rotateHandlePos,
  rotationFromPointer,
  scaleFromPointer,
  type LngLatCorners,
  type OverlayTransform,
} from '@/lib/geo/imageOverlay';

function dot(color: string, cursor: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `width:15px;height:15px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35);cursor:${cursor}`;
  return el;
}

type Args = {
  map: MapLibreMap | null;
  /** Mount the handles only while the tool is in move/resize mode with an image. */
  active: boolean;
  /** Bump to remount the handles when a new image replaces the transform object. */
  version: number;
  /** The live transform; mutated in place during drags. */
  transformRef: RefObject<OverlayTransform | null>;
  /** Called with the new corners after every drag tick (the caller updates the image source). */
  onChange: (corners: LngLatCorners) => void;
};

/**
 * The three drag handles on the reference image: blue centre dot moves, green
 * corner dot resizes (uniform scale, rotation locked — the handle stays glued
 * to the corner, so dragging just grows/shrinks the box), purple dot above the
 * top edge rotates. Markers are added/removed with `active`.
 */
export function useTransformHandles({ map, active, version, transformRef, onChange }: Args) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const st = transformRef.current;
    if (!map || !active || !st) return;

    const cs = corners(st);
    const cm = new Marker({ element: dot('#2563eb', 'move'), draggable: true, anchor: 'center' })
      .setLngLat(st.center)
      .addTo(map);
    const tm = new Marker({
      element: dot('#16a34a', 'nwse-resize'),
      draggable: true,
      anchor: 'center',
    })
      .setLngLat(cs[1])
      .addTo(map);
    const rm = new Marker({ element: dot('#9333ea', 'grab'), draggable: true, anchor: 'center' })
      .setLngLat(rotateHandlePos(st))
      .addTo(map);

    // Reposition the image + the handles that didn't initiate the drag.
    const sync = (skip?: 'center' | 'tr' | 'rot') => {
      const next = corners(st);
      if (skip !== 'center') cm.setLngLat(st.center);
      if (skip !== 'tr') tm.setLngLat(next[1]);
      if (skip !== 'rot') rm.setLngLat(rotateHandlePos(st));
      onChangeRef.current(next);
    };

    cm.on('drag', () => {
      const ll = cm.getLngLat();
      st.center = [ll.lng, ll.lat];
      sync('center');
    });
    tm.on('drag', () => {
      st.scale = scaleFromPointer(st, tm.getLngLat());
      sync();
    });
    rm.on('drag', () => {
      st.rotDeg = rotationFromPointer(st, rm.getLngLat());
      sync();
    });

    return () => {
      cm.remove();
      tm.remove();
      rm.remove();
    };
  }, [map, active, version, transformRef]);
}
