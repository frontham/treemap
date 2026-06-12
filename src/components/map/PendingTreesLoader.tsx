'use client';

import { useEffect, useState } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapContext';
import { PENDING_SOURCE } from './treeLayer';
import { trpc } from '@/lib/trpc/client';
import { listQueue, onQueueChanged } from '@/lib/offline/queue';

type PendingPayload = { location?: { lng: number; lat: number } };

/**
 * Renders queued (unsynced) trees as translucent pins so the user gets
 * immediate feedback after saving offline. Only ops queued under the active
 * project are shown (they also only drain there). Re-reads the queue whenever
 * it changes; OfflineProvider clears entries as they sync.
 */
export function PendingTreesLoader() {
  const { map } = useMap();
  const { data: me } = trpc.auth.me.useQuery();
  const activeProjectId = me?.project?.id;
  const [version, setVersion] = useState(0);

  useEffect(() => onQueueChanged(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    if (!map) return;
    const src = map.getSource(PENDING_SOURCE) as GeoJSONSource | undefined;
    if (!src) return;

    const features = listQueue()
      .filter((op) => op.kind === 'trees.create')
      .filter((op) => !op.projectId || op.projectId === activeProjectId)
      .flatMap((op) => {
        const loc = (op.payload as PendingPayload).location;
        if (!loc) return [];
        return [
          {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [loc.lng, loc.lat] },
            properties: { id: op.id },
          },
        ];
      });

    src.setData({ type: 'FeatureCollection', features });
  }, [map, version, activeProjectId]);

  return null;
}
