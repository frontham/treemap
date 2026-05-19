'use client';

import { useEffect } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useCompose } from './ComposeContext';

/**
 * Side-effect controller for compose mode:
 *   - while 'placing': crosshair cursor on the map canvas
 *   - while 'placing': the next map click becomes the draft location
 *   - while not idle: Esc cancels
 */
export function ComposeMapHandler() {
  const { map } = useMap();
  const { mode, setDraft, cancel } = useCompose();

  useEffect(() => {
    if (!map) return;
    map.getCanvas().style.cursor = mode === 'placing' ? 'crosshair' : '';
  }, [map, mode]);

  useEffect(() => {
    if (!map || mode !== 'placing') return;
    const onClick = (e: MapMouseEvent) => {
      setDraft({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, mode, setDraft]);

  useEffect(() => {
    if (mode === 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, cancel]);

  return null;
}
