'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/cn';
import { getBasemap, type BasemapId } from '@/components/map/basemaps';
import { colors } from '@/styles/tokens';

type Props = {
  center: { lng: number; lat: number };
  zoom: number;
  basemapId: BasemapId;
  /** Sizes the frame (the snapshot fills it). */
  className?: string;
};

/**
 * A non-interactive map centred on the tree with the tree marked, frozen into
 * an <img> once all tiles are in. Browsers often print WebGL canvases blank,
 * so the report always prints the captured still; rendering at 2× pixel ratio
 * keeps it sharp on paper. The GL context is released right after capture, so
 * switching basemaps never piles up contexts.
 */
export function MapSnapshot({ center, zoom, basemapId, className }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState<string | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    setStill(null);

    const map = new maplibregl.Map({
      container: el,
      style: getBasemap(basemapId).style,
      center: [center.lng, center.lat],
      zoom,
      interactive: false,
      attributionControl: false, // attribution is printed as a caption instead
      pixelRatio: 2,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    map.on('load', () => {
      map.addSource('report-tree', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [center.lng, center.lat] },
          properties: {},
        },
      });
      // Soft halo + solid pin, echoing how the selected tree looks on the map.
      map.addLayer({
        id: 'report-tree-halo',
        type: 'circle',
        source: 'report-tree',
        paint: { 'circle-radius': 16, 'circle-color': colors.accent, 'circle-opacity': 0.2 },
      });
      map.addLayer({
        id: 'report-tree-pin',
        type: 'circle',
        source: 'report-tree',
        paint: {
          'circle-radius': 7,
          'circle-color': colors.accent,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
        },
      });
    });

    let done = false;
    const capture = () => {
      if (done) return;
      done = true;
      try {
        setStill(map.getCanvas().toDataURL('image/png'));
      } catch {
        /* lost context — leave the live map showing rather than nothing */
      }
      map.remove();
    };

    map.once('idle', capture);
    // A slow or failing tile must not hold the report hostage — capture what we
    // have after a grace period.
    const fallback = window.setTimeout(capture, 10_000);

    return () => {
      window.clearTimeout(fallback);
      if (!done) {
        done = true;
        map.remove();
      }
    };
  }, [basemapId, center.lng, center.lat, zoom]);

  return (
    <div className={cn('relative', className)}>
      <div ref={frameRef} className="absolute inset-0" />
      {still ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
    </div>
  );
}
