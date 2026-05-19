import type { ExportTreeRow } from './fetchTreesForExport';

type Feature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, unknown>;
};

export function rowsToGeoJson(rows: ExportTreeRow[]) {
  const features: Feature[] = rows.map((r) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] },
    properties: {
      id: r.id,
      commonName: r.common_name,
      scientificName: r.scientific_name,
      health: r.health,
      condition: r.condition,
      dbhCm: r.dbh_cm,
      heightM: r.height_m,
      canopyRadiusM: r.canopy_radius_m,
      estimatedAgeYears: r.estimated_age_years,
      plantedDate: formatDateOnly(r.planted_date),
      notes: r.notes,
      ...(r.custom_fields ?? {}),
    },
  }));
  return { type: 'FeatureCollection' as const, features };
}

function formatDateOnly(value: string | Date | null): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}
