import type { ImportTreeValues } from './insertTreeRow';

type Feature = {
  type?: unknown;
  geometry?: { type?: unknown; coordinates?: unknown };
  properties?: Record<string, unknown> | null;
};

const STANDARD_KEYS = new Set([
  'id',
  'commonName',
  'scientificName',
  'health',
  'condition',
  'dbhCm',
  'heightM',
  'canopyRadiusM',
  'estimatedAgeYears',
  'plantedDate',
  'notes',
]);

/**
 * Maps a GeoJSON Feature to our import shape. Unknown property keys land in
 * `customFields` so round-tripping our own export preserves them.
 * Returns null for anything that isn't a Point with valid coordinates.
 */
export function geoJsonFeatureToTree(f: unknown): ImportTreeValues | null {
  if (!f || typeof f !== 'object') return null;
  const feat = f as Feature;
  if (feat.geometry?.type !== 'Point') return null;
  const coords = feat.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;

  const props = feat.properties ?? {};
  const customFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!STANDARD_KEYS.has(k)) customFields[k] = v;
  }

  return {
    lng,
    lat,
    commonName: asString(props.commonName),
    scientificName: asString(props.scientificName),
    health: asString(props.health),
    condition: asString(props.condition),
    dbhCm: asNumber(props.dbhCm),
    heightM: asNumber(props.heightM),
    canopyRadiusM: asNumber(props.canopyRadiusM),
    estimatedAgeYears: asNumber(props.estimatedAgeYears),
    plantedDate: asString(props.plantedDate),
    notes: asString(props.notes),
    customFields,
  };
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.length > 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
