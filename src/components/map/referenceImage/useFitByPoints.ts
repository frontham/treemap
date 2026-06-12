'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import { useAlign } from '../AlignContext';
import type { Pt } from '@/lib/geo/imageOverlay';

export type PointPair = { from: Pt; to: Pt };

const FIT_SRC = 'ref-fit';
const FIT_LINE = 'ref-fit-line';
const FIT_PT = 'ref-fit-pt';

function fitFC(pairs: PointPair[], pending: Pt | null) {
  const features: GeoJSON.Feature[] = [];
  for (const p of pairs) {
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [p.from, p.to] }, properties: { role: 'line' } });
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: p.from }, properties: { role: 'from' } });
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: p.to }, properties: { role: 'to' } });
  }
  if (pending) features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pending }, properties: { role: 'from' } });
  return { type: 'FeatureCollection' as const, features };
}

/**
 * Fit-by-points capture for the reference image: while active, each map click
 * alternates between "feature on the image" and "its real spot on the map",
 * building from→to pairs drawn as dashed amber lines. Pin selection is
 * suppressed via AlignContext while capturing. Layers and handlers are torn
 * down when `active` drops.
 */
export function useFitByPoints(map: MapLibreMap | null, active: boolean) {
  const { setCapturingPoints } = useAlign();
  const pairsRef = useRef<PointPair[]>([]);
  const pendingRef = useRef<Pt | null>(null);
  const [pairCount, setPairCount] = useState(0);

  const updateSource = () => {
    (map?.getSource(FIT_SRC) as GeoJSONSource | undefined)?.setData(
      fitFC(pairsRef.current, pendingRef.current),
    );
  };

  const clearPairs = () => {
    pairsRef.current = [];
    pendingRef.current = null;
    setPairCount(0);
    updateSource();
  };

  useEffect(() => {
    if (!map || !active) return;
    setCapturingPoints(true);
    if (!map.getSource(FIT_SRC)) {
      map.addSource(FIT_SRC, { type: 'geojson', data: fitFC([], null) });
      map.addLayer({
        id: FIT_LINE,
        type: 'line',
        source: FIT_SRC,
        filter: ['==', ['get', 'role'], 'line'],
        paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-dasharray': [2, 1] },
      });
      map.addLayer({
        id: FIT_PT,
        type: 'circle',
        source: FIT_SRC,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': ['match', ['get', 'role'], 'from', '#f59e0b', 'to', '#16a34a', '#999'],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
        },
      });
    }
    updateSource();
    const onClick = (e: MapMouseEvent) => {
      const ll: Pt = [e.lngLat.lng, e.lngLat.lat];
      if (!pendingRef.current) {
        pendingRef.current = ll;
      } else {
        pairsRef.current = [...pairsRef.current, { from: pendingRef.current, to: ll }];
        pendingRef.current = null;
        setPairCount(pairsRef.current.length);
      }
      updateSource();
    };
    map.on('click', onClick);
    map.getCanvas().style.cursor = 'crosshair';
    return () => {
      map.off('click', onClick);
      map.getCanvas().style.cursor = '';
      setCapturingPoints(false);
      if (map.getLayer(FIT_PT)) map.removeLayer(FIT_PT);
      if (map.getLayer(FIT_LINE)) map.removeLayer(FIT_LINE);
      if (map.getSource(FIT_SRC)) map.removeSource(FIT_SRC);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, active]);

  return {
    pairCount,
    /** Read-only peek at the in-progress first click of a pair. */
    pendingRef,
    clearPairs,
    getPairs: () => pairsRef.current,
  };
}
