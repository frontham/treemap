'use client';

import { useEffect, useRef } from 'react';
import { Marker, type MapMouseEvent } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useTreeMove } from './TreeMoveContext';

// A crosshair so the exact point is unambiguous — the centre dot is the
// location. White strokes + drop-shadow stay legible on any basemap.
function handleEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:32px;height:32px;cursor:grab;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7));';
  el.innerHTML =
    '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M16 2V12M16 20V30M2 16H12M20 16H30" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="16" cy="16" r="2.5" fill="#2563eb" stroke="#fff" stroke-width="1.5"/>' +
    '</svg>';
  return el;
}

/**
 * While a tree is being relocated: recenters on the tree, shows a draggable
 * crosshair, and lets a map tap drop it at the tapped point (so it works
 * without precise dragging — important on touch). The move bar edits the same
 * draft; nothing persists until that bar saves.
 */
export function TreeMoveHandler() {
  const { map } = useMap();
  const { movingId, draft, setDraft } = useTreeMove();
  const markerRef = useRef<Marker | null>(null);
  const draggingRef = useRef(false);

  // Set up the marker + map interactions for the move session.
  useEffect(() => {
    if (!map || !movingId || !draft) return;
    const start = draft;

    // Bring the tree into view (the drawer is closed during a move).
    map.easeTo({ center: [start.lng, start.lat], duration: 300 });

    const m = new Marker({ element: handleEl(), draggable: true, anchor: 'center' })
      .setLngLat([start.lng, start.lat])
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

    // Tap anywhere on the map to drop the marker there.
    const onMapClick = (e: MapMouseEvent) => {
      setDraft({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };
    map.on('click', onMapClick);
    map.getCanvas().style.cursor = 'crosshair';

    return () => {
      map.off('click', onMapClick);
      map.getCanvas().style.cursor = '';
      m.remove();
      markerRef.current = null;
      draggingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, movingId]);

  // Reflect typed coordinates / taps onto the marker (skip while it's dragged).
  useEffect(() => {
    if (!draft || draggingRef.current) return;
    markerRef.current?.setLngLat([draft.lng, draft.lat]);
  }, [draft]);

  return null;
}
