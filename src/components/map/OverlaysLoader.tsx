'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ImageSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { trpc } from '@/lib/trpc/client';
import { TREES_CLUSTER_LAYER } from './treeLayer';
import { isLayerVisible, resolveLayerOpacity, useLayers } from './LayersContext';
import { useAlign } from './AlignContext';

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
  const { editingOverlay } = useAlign();
  const { data: allOverlays = [] } = trpc.overlays.list.useQuery();

  // The overlay being edited is rendered by the reference-image tool instead,
  // so drop it here to avoid showing a frozen duplicate at its old corners.
  const editingId = editingOverlay?.id;
  const overlays = useMemo(
    () => allOverlays.filter((o) => o.id !== editingId),
    [allOverlays, editingId],
  );

  // Last image url + corners pushed to each source, so edits (reposition /
  // replace via overlays.update) re-sync instead of sticking at old values.
  const applied = useRef<Map<string, { url: string; csig: string }>>(new Map());

  // Sync source + layer set with the overlays list.
  useEffect(() => {
    if (!map) return;
    const presentIds = new Set(overlays.map((o) => o.id));

    for (const o of overlays) {
      const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
        [o.corners[0].lng, o.corners[0].lat],
        [o.corners[1].lng, o.corners[1].lat],
        [o.corners[2].lng, o.corners[2].lat],
        [o.corners[3].lng, o.corners[3].lat],
      ];
      const csig = JSON.stringify(coordinates);
      const existing = map.getSource(sourceId(o.id)) as ImageSource | undefined;

      if (existing) {
        const prev = applied.current.get(o.id);
        if (!prev || prev.url !== o.url) {
          existing.updateImage({ url: o.url, coordinates }); // image swapped (Replace)
        } else if (prev.csig !== csig) {
          existing.setCoordinates(coordinates); // just repositioned
        }
        applied.current.set(o.id, { url: o.url, csig });
        continue;
      }

      map.addSource(sourceId(o.id), { type: 'image', url: o.url, coordinates });
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
      applied.current.set(o.id, { url: o.url, csig });
    }

    const style = map.getStyle();
    style.layers?.forEach((layer) => {
      if (!layer.id.startsWith(SOURCE_PREFIX) || !layer.id.endsWith(LAYER_SUFFIX)) return;
      const id = layer.id.slice(SOURCE_PREFIX.length, -LAYER_SUFFIX.length);
      if (presentIds.has(id)) return;
      map.removeLayer(layer.id);
      map.removeSource(sourceId(id));
      applied.current.delete(id);
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
