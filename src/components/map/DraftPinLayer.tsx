'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Marker } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useCompose } from './ComposeContext';
import { colors } from '@/styles/tokens';

/**
 * Renders the draft tree as a draggable MapLibre marker. When the user drags
 * it, the new location is written back into compose state so the form stays
 * in sync.
 */
export function DraftPinLayer() {
  const { map } = useMap();
  const { draft, setDraft } = useCompose();
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!draft) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLngLat([draft.lng, draft.lat]);
      return;
    }

    const el = buildPinElement();
    const marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([draft.lng, draft.lat])
      .addTo(map);

    marker.on('dragend', () => {
      const ll = marker.getLngLat();
      setDraft({ lng: ll.lng, lat: ll.lat });
    });

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, draft, setDraft]);

  return null;
}

function buildPinElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.borderRadius = '999px';
  el.style.background = colors.accent;
  el.style.border = '2px solid #fff';
  el.style.boxShadow = `0 0 0 6px ${colors.accentSoft}, 0 1px 2px rgba(14,16,18,0.18)`;
  el.style.cursor = 'grab';
  return el;
}
