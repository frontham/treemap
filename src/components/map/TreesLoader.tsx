'use client';

import { useEffect } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { TREES_SOURCE } from './treeLayer';
import { trpc } from '@/lib/trpc/client';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Fetches the tree FeatureCollection from the server and pushes it into the
 * map's trees source. Shows a small "Loading trees…" chip while the first load
 * (or a project switch) is in flight.
 */
export function TreesLoader() {
  const { map } = useMap();
  const { data, isPending } = trpc.trees.list.useQuery();

  useEffect(() => {
    if (!map || !data) return;
    const src = map.getSource(TREES_SOURCE) as GeoJSONSource | undefined;
    src?.setData(data);
  }, [map, data]);

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
