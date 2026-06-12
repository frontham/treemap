'use client';

import { useEffect, useState, type RefObject } from 'react';
import maplibregl, { type Map } from 'maplibre-gl';
import { getBasemap, readStoredBasemapId } from './basemaps';
import { addTreeLayer } from './treeLayer';
import type { Cursor } from './MapContext';

type Args = {
  ref: RefObject<HTMLDivElement | null>;
  initialCenter: Cursor;
  initialZoom: number;
};

/**
 * Owns the MapLibre instance lifecycle: create on mount, dispose on unmount.
 * Exposes the loaded map plus an error string we can surface to the user when
 * something goes wrong. Deliberately does NOT track the cursor in React state —
 * that would re-render the owner (and everything below it) on every mousemove;
 * cursor consumers subscribe to map events themselves (see CursorCoordReadout).
 */
export function useMaplibre({ ref, initialCenter, initialZoom }: Args) {
  const [map, setMap] = useState<Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    let instance: Map;
    try {
      instance = new maplibregl.Map({
        container: ref.current,
        style: getBasemap(readStoredBasemapId()).style,
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        attributionControl: { compact: true },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    const handleError = (e: { error?: { message?: string } }) => {
      setError(e.error?.message ?? 'Map error');
      // eslint-disable-next-line no-console
      console.error('[map]', e);
    };

    instance.on('error', handleError);
    instance.once('load', () => {
      addTreeLayer(instance);
      setMap(instance);
    });

    return () => {
      instance.off('error', handleError);
      instance.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { map, error };
}
