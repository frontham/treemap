'use client';

import { useEffect, useState } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
import { CoordReadout } from '@/components/layout/CoordReadout';
import { useMap } from './MapContext';
import type { Cursor } from './MapContext';

/**
 * Subscribes to the map's mousemove itself and renders the presentational
 * CoordReadout. Keeping the per-mousemove state local to this leaf means only
 * this component re-renders while the pointer moves — not the whole map UI.
 * Hides itself before the first mousemove.
 */
export function CursorCoordReadout() {
  const { map } = useMap();
  const [cursor, setCursor] = useState<Cursor | null>(null);

  useEffect(() => {
    if (!map) return;
    const onMove = (e: MapMouseEvent) => setCursor({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    map.on('mousemove', onMove);
    return () => {
      map.off('mousemove', onMove);
    };
  }, [map]);

  if (!cursor) return null;
  return <CoordReadout lng={cursor.lng} lat={cursor.lat} />;
}
