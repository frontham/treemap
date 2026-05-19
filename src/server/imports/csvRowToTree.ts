import type { ImportTreeValues } from './insertTreeRow';

/**
 * Maps a CSV row (as produced by toCsv) back to our import shape.
 * Tolerates missing or malformed cells; returns null if lng/lat aren't valid.
 */
export function csvRowToTree(r: Record<string, string>): ImportTreeValues | null {
  const lng = Number(r.lng);
  const lat = Number(r.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  return {
    lng,
    lat,
    commonName: nonEmpty(r.common_name),
    scientificName: nonEmpty(r.scientific_name),
    health: nonEmpty(r.health),
    condition: nonEmpty(r.condition),
    dbhCm: toNum(r.dbh_cm),
    heightM: toNum(r.height_m),
    canopyRadiusM: toNum(r.canopy_radius_m),
    estimatedAgeYears: toNum(r.estimated_age_years),
    plantedDate: nonEmpty(r.planted_date),
    notes: nonEmpty(r.notes),
    customFields: parseCustomFields(r.custom_fields),
  };
}

function nonEmpty(v?: string): string | null {
  return v != null && v.length > 0 ? v : null;
}

function toNum(v?: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseCustomFields(raw?: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
