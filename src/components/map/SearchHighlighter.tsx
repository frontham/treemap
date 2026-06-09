'use client';

import { useEffect } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useSearch } from './SearchContext';
import { HIGHLIGHT_PIN_PAINT } from './treeLayer';

const SRC = 'search-highlight';
const LAYER = 'search-highlight-pin';

/**
 * Turns every tree currently matching the search query orange — the same pin
 * styling as the selected tree — so matches stand out on the map (not just in
 * the dropdown). Uses a dedicated source because the trees source is clustered,
 * where per-feature ids aren't stable. Self-heals after a basemap swap drops the
 * layer (mirrors SelectedTreeHighlighter).
 */
export function SearchHighlighter() {
  const { map } = useMap();
  const { highlights } = useSearch();

  useEffect(() => {
    if (!map) return;

    const data = {
      type: 'FeatureCollection' as const,
      features: highlights.map(([lng, lat]) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: {},
      })),
    };

    // Update the matches on the layer. `setData` on an existing source is safe
    // even while the map is busy (e.g. flying after a pick, when isStyleLoaded()
    // is false for the whole animation); only addSource/addLayer need the style
    // loaded, so we gate just those.
    const apply = () => {
      const existing = map.getSource(SRC) as GeoJSONSource | undefined;
      if (existing) {
        existing.setData(data);
      } else if (map.isStyleLoaded()) {
        map.addSource(SRC, { type: 'geojson', data });
      } else {
        return; // can't add the source yet — `styledata` will retry
      }
      if (!map.getLayer(LAYER) && map.isStyleLoaded()) {
        // No beforeId → sits on top of the health pins, so matches read orange.
        map.addLayer({ id: LAYER, type: 'circle', source: SRC, paint: HIGHLIGHT_PIN_PAINT });
      }
    };

    apply();

    // A basemap swap drops our source/layer (not carried across setStyle); re-add
    // them once the new style settles. Normal data updates don't need this — the
    // setData above applies them immediately, even mid-flight.
    const onStyleData = () => {
      if (!map.getLayer(LAYER)) apply();
    };
    map.on('styledata', onStyleData);
    return () => {
      map.off('styledata', onStyleData);
    };
  }, [map, highlights]);

  return null;
}
