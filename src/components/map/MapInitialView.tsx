'use client';

import { useEffect, useRef } from 'react';
import { useMap } from './MapContext';
import { trpc } from '@/lib/trpc/client';
import { fitToTrees } from './fitToTrees';

/**
 * Sets the opening view once per map mount (i.e. per project): fit to the
 * project's trees so you land on the pins. If the project has no trees yet,
 * fall back to the user's GPS location so they can place the first one near
 * themselves. "Locate me" remains available for manual re-centering.
 */
export function MapInitialView() {
  const { map } = useMap();
  const { data, isPending } = trpc.trees.list.useQuery();
  const done = useRef(false);

  useEffect(() => {
    if (!map || isPending || done.current) return;
    done.current = true;

    if (fitToTrees(map, data?.features ?? [])) return;

    // Empty project → center on the user instead.
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: Math.max(map.getZoom(), 16),
            essential: true,
          }),
        (err) => {
          // eslint-disable-next-line no-console
          console.error('[initial-view]', err);
        },
        { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
      );
    }
  }, [map, data, isPending]);

  return null;
}
