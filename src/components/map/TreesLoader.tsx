'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useDeadTrees } from './DeadTreesContext';
import { usePinColor } from './PinColorContext';
import { useTreeFilter, passesFilter } from './TreeFilterContext';
import { pinColorExpression } from './pinColor';
import { TREES_SOURCE, TREES_PIN_LAYER, DEAD_DIM_OPACITY } from './treeLayer';
import { trpc } from '@/lib/trpc/client';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/lib/i18n/LocaleProvider';

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
  const t = useT();

  // Keep the latest prefs + data in a ref so the styledata handler (registered
  // once per map) always reads current values rather than a stale closure, and
  // so the application is robust to the order in which the map finishes loading
  // vs. the tree data arrives.
  const latest = useRef({ mode, colorBy, excluded, data });
  latest.current = { mode, colorBy, excluded, data };

  // `map` is only put into context after the style 'load' + addTreeLayer (see
  // useMaplibre), so when it's non-null the source and layers already exist —
  // no need to gate on isStyleLoaded(); just apply.
  const apply = useCallback(() => {
    if (!map) return;
    const { mode, colorBy, excluded, data } = latest.current;
    if (!data) return;
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
  }, [map]);

  // Re-apply on the first map-ready render and whenever the data or a preference
  // changes (including the post-mount load of the persisted prefs).
  useEffect(() => {
    apply();
  }, [apply, data, mode, colorBy, excluded]);

  // A basemap swap (setStyle) re-injects the source/layers empty; re-apply once
  // the new style settles.
  useEffect(() => {
    if (!map) return;
    map.on('styledata', apply);
    return () => {
      map.off('styledata', apply);
    };
  }, [map, apply]);

  if (!isPending) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2">
      <span className="inline-flex items-center gap-2 rounded-full bg-panel/90 px-3 py-1.5 text-sm text-muted hairline shadow-floating backdrop-blur-md">
        <Spinner size={14} className="text-accent" />
        {t('trees.loading')}
      </span>
    </div>
  );
}
