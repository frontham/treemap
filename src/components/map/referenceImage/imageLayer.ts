import type { Map as MapLibreMap, ImageSource } from 'maplibre-gl';
import { TREES_CLUSTER_LAYER } from '../treeLayer';
import type { LngLatCorners } from '@/lib/geo/imageOverlay';

export const REF_IMAGE_SOURCE = 'ref-image';
export const REF_IMAGE_LAYER = 'ref-image-layer';

/** Add the reference image to the map, slotted under the tree pins. */
export function addReferenceImage(
  map: MapLibreMap,
  url: string,
  coordinates: LngLatCorners,
  opacity: number,
) {
  map.addSource(REF_IMAGE_SOURCE, { type: 'image', url, coordinates });
  const before = map.getLayer(TREES_CLUSTER_LAYER) ? TREES_CLUSTER_LAYER : undefined;
  map.addLayer(
    {
      id: REF_IMAGE_LAYER,
      type: 'raster',
      source: REF_IMAGE_SOURCE,
      paint: { 'raster-opacity': opacity, 'raster-fade-duration': 0 },
    },
    before,
  );
}

export function removeReferenceImage(map: MapLibreMap) {
  if (map.getLayer(REF_IMAGE_LAYER)) map.removeLayer(REF_IMAGE_LAYER);
  if (map.getSource(REF_IMAGE_SOURCE)) map.removeSource(REF_IMAGE_SOURCE);
}

export function setReferenceImageCorners(map: MapLibreMap, coordinates: LngLatCorners) {
  (map.getSource(REF_IMAGE_SOURCE) as ImageSource | undefined)?.setCoordinates(coordinates);
}

export function setReferenceImageOpacity(map: MapLibreMap, opacity: number) {
  if (map.getLayer(REF_IMAGE_LAYER)) {
    map.setPaintProperty(REF_IMAGE_LAYER, 'raster-opacity', opacity);
  }
}
