'use client';

import { useEffect } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { TREES_SOURCE } from './treeLayer';
import { trpc } from '@/lib/trpc/client';

/**
 * Fetches the tree FeatureCollection from the server and pushes it into the
 * map's trees source. The list query is invalidated by the create mutation,
 * so saved trees appear immediately.
 */
export function TreesLoader() {
  const { map } = useMap();
  const { data } = trpc.trees.list.useQuery();

  useEffect(() => {
    if (!map || !data) return;
    const src = map.getSource(TREES_SOURCE) as GeoJSONSource | undefined;
    src?.setData(data);
  }, [map, data]);

  return null;
}
