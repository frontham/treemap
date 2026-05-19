'use client';

import { createContext, useContext } from 'react';
import type { Map } from 'maplibre-gl';

export type Cursor = { lng: number; lat: number };

export type MapContextValue = {
  map: Map | null;
  cursor: Cursor | null;
};

export const MapContext = createContext<MapContextValue>({
  map: null,
  cursor: null,
});

export function useMap(): MapContextValue {
  return useContext(MapContext);
}
