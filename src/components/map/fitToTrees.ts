import { LngLatBounds, type Map } from 'maplibre-gl';

type PointFeature = { geometry: { coordinates: number[] } };

/**
 * Fit the camera to the project's tree pins. Returns false (a no-op) when the
 * project has no trees, so callers can fall back (e.g. to the user's location).
 * Shared by the opening view (MapInitialView) and the "fit to project" button.
 */
export function fitToTrees(map: Map, features: PointFeature[]): boolean {
  const bounds = new LngLatBounds();
  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates;
    if (typeof lng === 'number' && typeof lat === 'number') bounds.extend([lng, lat]);
  }
  if (bounds.isEmpty()) return false;
  map.fitBounds(bounds, {
    padding: { top: 80, bottom: 48, left: 48, right: 48 },
    maxZoom: 17,
    duration: 600,
  });
  return true;
}
