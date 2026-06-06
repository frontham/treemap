import { sql } from 'drizzle-orm';
import { withOrgContext, type OrgContext } from '@/server/db/tenantContext';

export type ExportTreeRow = {
  id: string;
  common_name: string | null;
  scientific_name: string | null;
  health: string | null;
  condition: string | null;
  dbh_cm: number | null;
  height_m: number | null;
  canopy_radius_m: number | null;
  estimated_age_years: number | null;
  planted_date: string | Date | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  lng: number;
  lat: number;
};

/**
 * Reads all non-deleted trees for the given org/user context. Shared by every
 * export format so they always agree on which rows leave the system.
 */
export async function fetchTreesForExport(ctx: OrgContext): Promise<ExportTreeRow[]> {
  return withOrgContext(ctx, async (tx) => {
    const result = await tx.execute(sql`
      SELECT id, common_name, scientific_name, health, condition,
             dbh_cm, height_m, canopy_radius_m, estimated_age_years,
             planted_date, notes, custom_fields,
             ST_X(location::geometry) AS lng,
             ST_Y(location::geometry) AS lat
      FROM trees
      WHERE deleted_at IS NULL
        AND (current_project_id() IS NULL OR project_id = current_project_id())
      ORDER BY created_at DESC
    `);
    return result.rows as ExportTreeRow[];
  });
}
