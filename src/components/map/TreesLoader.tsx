'use client';

import { useEffect } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useDeadTrees } from './DeadTreesContext';
import { usePinColor } from './PinColorContext';
import { useTreeFilter, passesFilter } from './TreeFilterContext';
import { pinColorExpression } from './pinColor';
import { TREES_SOURCE, TREES_PIN_LAYER, DEAD_DIM_OPACITY } from './treeLayer';
import { trpc } from '@/lib/trpc/client';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Fetches the tree FeatureCollection from the server and pushes it into the
 * map's trees source, applying the dead-tree display mode:
 *   - 'hide' drops dead trees from the source (so clusters don't count them);
 *   - 'dim'  fades dead pins via a per-feature opacity expression;
 *   - 'show' leaves them at full opacity.
 * Re-applies on a basemap swap (styledata), which would otherwise reset the paint.
 * Shows a small "Loading trees…" chip while the first load (or a project switch)
 * is in flight.
 */
export function TreesLoader() {
  const { map } = useMap();
  const { mode } = useDeadTrees();
  const { colorBy } = usePinColor();
  const { excluded } = useTreeFilter();
  const { data, isPending } = trpc.trees.list.useQuery();

  useEffect(() => {
    if (!map || !data) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      const src = map.getSource(TREES_SOURCE) as GeoJSONSource | undefined;
      if (!src) return;

      const features = data.features.filter((f) => {
        if (mode === 'hide' && f.properties.health === 'dead') return false;
        return passesFilter(excluded, f.properties);
      });
      src.setData({ type: 'FeatureCollection', features });

      if (map.getLayer(TREES_PIN_LAYER)) {
        map.setPaintProperty(TREES_PIN_LAYER, 'circle-color', pinColorExpression(colorBy));
        // In 'dim' fade only the dead pins; otherwise everything is fully opaque
        // (dead pins are filtered out entirely in 'hide').
        const opacity =
          mode === 'dim'
            ? ['case', ['==', ['get', 'health'], 'dead'], DEAD_DIM_OPACITY, 1]
            : 1;
        map.setPaintProperty(TREES_PIN_LAYER, 'circle-opacity', opacity);
        map.setPaintProperty(TREES_PIN_LAYER, 'circle-stroke-opacity', opacity);
      }
    };

    apply();

    // A basemap swap (setStyle) re-injects the layers; re-apply once it settles.
    const onStyleData = () => apply();
    map.on('styledata', onStyleData);
    return () => {
      map.off('styledata', onStyleData);
    };
  }, [map, data, mode, colorBy, excluded]);

  if (!isPending) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2">
      <span className="inline-flex items-center gap-2 rounded-full bg-panel/90 px-3 py-1.5 text-sm text-muted hairline shadow-floating backdrop-blur-md">
        <Spinner size={14} className="text-accent" />
        Loading trees…
      </span>
    </div>
  );
}
