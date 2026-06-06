'use client';

import { useEffect, useRef } from 'react';
import { Marker } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useTreeMove } from './TreeMoveContext';

function handleEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35);cursor:grab';
  return el;
}

/**
 * While a tree is being relocated, shows a draggable marker at the draft
 * location and writes drags back into the move context. The sidebar edits the
 * same draft (typed coordinates), so the two stay in sync.
 */
export function TreeMoveHandler() {
  const { map } = useMap();
  const { movingId, draft, setDraft } = useTreeMove();
  const markerRef = useRef<Marker | null>(null);
  const draggingRef = useRef(false);

  // Create/destroy the marker with the move session (not on every draft change).
  useEffect(() => {
    if (!map || !movingId || !draft) return;
    const m = new Marker({ element: handleEl(), draggable: true, anchor: 'center' })
      .setLngLat([draft.lng, draft.lat])
      .addTo(map);
    m.on('dragstart', () => {
      draggingRef.current = true;
    });
    m.on('drag', () => {
      const ll = m.getLngLat();
      setDraft({ lng: ll.lng, lat: ll.lat });
    });
    m.on('dragend', () => {
      draggingRef.current = false;
    });
    markerRef.current = m;
    return () => {
      m.remove();
      markerRef.current = null;
      draggingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, movingId]);

  // Reflect sidebar-typed coordinates onto the marker (skip while dragging it).
  useEffect(() => {
    if (!draft || draggingRef.current) return;
    markerRef.current?.setLngLat([draft.lng, draft.lat]);
  }, [draft]);

  return null;
}
