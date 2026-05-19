'use client';

import { useEffect } from 'react';
import { useMap } from './MapContext';
import { trpc } from '@/lib/trpc/client';
import { TREES_CLUSTER_LAYER } from './treeLayer';
import { isLayerVisible, resolveLayerOpacity, useLayers } from './LayersContext';

const SOURCE_PREFIX = 'overlay-';
const LAYER_SUFFIX = '-layer';

const layerId = (id: string) => `${SOURCE_PREFIX}${id}${LAYER_SUFFIX}`;
const sourceId = (id: string) => `${SOURCE_PREFIX}${id}`;

/**
 * Syncs the org's georeferenced image overlays into MapLibre.
 *   - First effect: keeps the source + layer set in sync with the list.
 *   - Second effect: applies per-session visibility + opacity overrides.
 * Splitting them avoids touching the source pile every time the user nudges
 * an opacity slider.
 */
export function OverlaysLoader() {
  const { map } = useMap();
  const layers = useLayers();
  const { data: overlays = [] } = trpc.overlays.list.useQuery();

  // Sync source + layer set with the overlays list.
  useEffect(() => {
    if (!map) return;
    const presentIds = new Set(overlays.map((o) => o.id));

    for (const o of overlays) {
      if (map.getSource(sourceId(o.id))) continue;
      map.addSource(sourceId(o.id), {
        type: 'image',
        url: o.url,
        coordinates: [
          [o.corners[0].lng, o.corners[0].lat],
          [o.corners[1].lng, o.corners[1].lat],
          [o.corners[2].lng, o.corners[2].lat],
          [o.corners[3].lng, o.corners[3].lat],
        ],
      });
      const beforeId = map.getLayer(TREES_CLUSTER_LAYER) ? TREES_CLUSTER_LAYER : undefined;
      map.addLayer(
        {
          id: layerId(o.id),
          type: 'raster',
          source: sourceId(o.id),
          paint: { 'raster-opacity': o.opacityDefault, 'raster-fade-duration': 0 },
        },
        beforeId,
      );
    }

    const style = map.getStyle();
    style.layers?.forEach((layer) => {
      if (!layer.id.startsWith(SOURCE_PREFIX) || !layer.id.endsWith(LAYER_SUFFIX)) return;
      const id = layer.id.slice(SOURCE_PREFIX.length, -LAYER_SUFFIX.length);
      if (presentIds.has(id)) return;
      map.removeLayer(layer.id);
      map.removeSource(sourceId(id));
    });
  }, [map, overlays]);

  // Apply per-session visibility + opacity overrides.
  useEffect(() => {
    if (!map) return;
    for (const o of overlays) {
      if (!map.getLayer(layerId(o.id))) continue;
      map.setLayoutProperty(
        layerId(o.id),
        'visibility',
        isLayerVisible(layers, o.id) ? 'visible' : 'none',
      );
      map.setPaintProperty(
        layerId(o.id),
        'raster-opacity',
        resolveLayerOpacity(layers, o.id, o.opacityDefault),
      );
    }
  }, [map, overlays, layers]);

  return null;
}
