'use client';

import { useEffect } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useSelection } from './SelectionContext';
import { HIGHLIGHT_PIN_PAINT } from './treeLayer';
import { trpc } from '@/lib/trpc/client';

const HL_SOURCE = 'tree-highlight';
const HL_LAYER = 'tree-highlight-pin';
const EMPTY = { type: 'FeatureCollection' as const, features: [] };

/**
 * Draws an orange marker on top of the currently selected tree so it's obvious
 * which one the drawer/edit refers to. Uses a dedicated single-point layer
 * (not feature-state) because the trees source is clustered, where per-feature
 * ids aren't stable. Self-heals after a basemap swap drops the layer.
 */
export function SelectedTreeHighlighter() {
  const { map } = useMap();
  const { selectedId } = useSelection();
  const { data: tree } = trpc.trees.get.useQuery(
    { id: selectedId ?? '' },
    { enabled: !!selectedId },
  );

  useEffect(() => {
    if (!map) return;

    const ensureLayer = () => {
      if (!map.getSource(HL_SOURCE)) {
        map.addSource(HL_SOURCE, { type: 'geojson', data: EMPTY });
      }
      if (!map.getLayer(HL_LAYER)) {
        // No beforeId → sits on top of the dark pins, so the selected one reads orange.
        map.addLayer({
          id: HL_LAYER,
          type: 'circle',
          source: HL_SOURCE,
          paint: HIGHLIGHT_PIN_PAINT,
        });
      }
    };

    const render = () => {
      if (!map.isStyleLoaded()) return;
      ensureLayer();
      const src = map.getSource(HL_SOURCE) as GeoJSONSource | undefined;
      if (!src) return;
      src.setData(
        selectedId && tree
          ? {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [tree.location.lng, tree.location.lat],
                  },
                  properties: {},
                },
              ],
            }
          : EMPTY,
      );
    };

    render();

    // A basemap swap (setStyle) drops this layer; re-create it once the new
    // style settles, then re-apply the current selection.
    const onStyleData = () => {
      if (map.isStyleLoaded() && !map.getLayer(HL_LAYER)) render();
    };
    map.on('styledata', onStyleData);
    return () => {
      map.off('styledata', onStyleData);
    };
  }, [map, selectedId, tree]);

  return null;
}
