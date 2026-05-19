'use client';

import { CoordReadout } from '@/components/layout/CoordReadout';
import { useMap } from './MapContext';

/**
 * Client wrapper that subscribes to the map's cursor coords and renders the
 * presentational CoordReadout. Hides itself before the first mousemove.
 */
export function CursorCoordReadout() {
  const { cursor } = useMap();
  if (!cursor) return null;
  return <CoordReadout lng={cursor.lng} lat={cursor.lat} />;
}
