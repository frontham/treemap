'use client';

import { useState } from 'react';
import { useMap } from './MapContext';
import { addTreeLayer } from './treeLayer';
import {
  carryAppLayers,
  getBasemap,
  readStoredBasemapId,
  storeBasemapId,
  type BasemapId,
} from './basemaps';

/**
 * The basemap swap choreography, shared by the desktop switcher and the mobile
 * menu: swap the MapLibre base style while preserving our trees/overlays/
 * reference-image layers via `carryAppLayers` (setStyle would otherwise wipe
 * everything on top). The choice is remembered in localStorage and applied on
 * the next load.
 */
export function useBasemapSelection() {
  const { map } = useMap();
  const [basemapId, setBasemapId] = useState<BasemapId>(() => readStoredBasemapId());

  const selectBasemap = (next: BasemapId) => {
    if (!map || next === basemapId) return;
    setBasemapId(next);
    storeBasemapId(next);
    // Default diff + transformStyle: only the base layers swap; our carried-over
    // app layers diff as unchanged, so trees/overlays don't flicker.
    map.setStyle(getBasemap(next).style, { transformStyle: carryAppLayers });
    // Defensive: if the trees source somehow didn't carry, re-add it (idempotent).
    map.once('styledata', () => addTreeLayer(map));
  };

  return { basemapId, selectBasemap };
}
