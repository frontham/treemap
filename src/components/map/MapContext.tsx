'use client';

import { createContext, useContext } from 'react';
import type { Map } from 'maplibre-gl';

export type Cursor = { lng: number; lat: number };

/**
 * Holds only the (stable) map instance. High-frequency facts like the cursor
 * position are deliberately NOT in here — a context value that changes per
 * mousemove re-renders every consumer on the page; subscribe to map events
 * directly instead (see CursorCoordReadout).
 */
export type MapContextValue = {
  map: Map | null;
};

export const MapContext = createContext<MapContextValue>({
  map: null,
});

export function useMap(): MapContextValue {
  return useContext(MapContext);
}
