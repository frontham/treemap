'use client';

import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl, { type Marker, type MapMouseEvent } from 'maplibre-gl';
import { useMaplibre } from '@/components/map/useMaplibre';
import { colors } from '@/styles/tokens';

type LngLat = { lng: number; lat: number };

type Props = {
  onMapClick: (loc: LngLat) => void;
  markers: { lng: number; lat: number; label: string }[];
};

/**
 * Small map embedded in the overlay editor. Click adds the next corner;
 * placed corners render as numbered orange markers.
 */
export function OverlayMiniMap({ onMapClick, markers }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map } = useMaplibre({
    ref: containerRef,
    initialCenter: { lng: -2.9916, lat: 53.4084 },
    initialZoom: 13,
  });

  useEffect(() => {
    if (!map) return;
    const onClick = (e: MapMouseEvent) =>
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, onMapClick]);

  useEffect(() => {
    if (!map) return;
    const placed: Marker[] = [];
    for (const m of markers) {
      placed.push(buildMarker(m).addTo(map));
    }
    return () => {
      placed.forEach((mk) => mk.remove());
    };
  }, [map, markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function buildMarker(m: { lng: number; lat: number; label: string }) {
  const el = document.createElement('div');
  el.textContent = m.label;
  Object.assign(el.style, {
    background: colors.accent,
    color: 'white',
    border: '2px solid white',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(14,16,18,0.25)',
  });
  return new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]);
}
