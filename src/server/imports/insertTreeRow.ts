import { sql } from 'drizzle-orm';
import type { Tx } from '@/server/db/tenantContext';

export type ImportTreeValues = {
  lng: number;
  lat: number;
  commonName?: string | null;
  scientificName?: string | null;
  health?: string | null;
  condition?: string | null;
  dbhCm?: number | null;
  heightM?: number | null;
  canopyRadiusM?: number | null;
  estimatedAgeYears?: number | null;
  plantedDate?: string | null;
  notes?: string | null;
  customFields?: Record<string, unknown>;
};

/**
 * Inserts one tree row inside an open RLS-scoped transaction. Both the
 * GeoJSON and CSV importers funnel through this so the SQL stays in one
 * place; if we batch-insert later, only this function needs to change.
 */
export async function insertTreeRow(tx: Tx, v: ImportTreeValues): Promise<void> {
  await tx.execute(sql`
    INSERT INTO trees (
      org_id, location, placed_via,
      common_name, scientific_name, health, condition,
      dbh_cm, height_m, canopy_radius_m, estimated_age_years,
      planted_date, notes, custom_fields,
      created_by, updated_by
    ) VALUES (
      current_org_id(),
      ST_SetSRID(ST_MakePoint(${v.lng}, ${v.lat}), 4326)::geography,
      'import',
      ${v.commonName ?? null},
      ${v.scientificName ?? null},
      ${v.health ?? 'unknown'},
      ${v.condition ?? 'unknown'},
      ${v.dbhCm ?? null},
      ${v.heightM ?? null},
      ${v.canopyRadiusM ?? null},
      ${v.estimatedAgeYears ?? null},
      ${v.plantedDate ?? null},
      ${v.notes ?? null},
      ${JSON.stringify(v.customFields ?? {})}::jsonb,
      current_user_id(),
      current_user_id()
    )
  `);
}
