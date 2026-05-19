import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { orgProcedure } from '../orgProcedure';
import type { TreeView } from '@/components/trees/TreeView';
import { insertTreeRow } from '@/server/imports/insertTreeRow';
import { geoJsonFeatureToTree } from '@/server/imports/geoJsonFeatureToTree';
import { csvRowToTree } from '@/server/imports/csvRowToTree';
import { parseCsv } from '@/server/imports/parseCsv';

const PlacedViaEnum = z.enum([
  'map_click',
  'current_location',
  'image_overlay',
  'import',
]);

const CustomFieldValues = z.record(z.string(), z.unknown()).optional();

const CreateTreeInput = z.object({
  location: z.object({ lng: z.number(), lat: z.number() }),
  locationAccuracyM: z.number().optional(),
  placedVia: PlacedViaEnum.default('map_click'),
  commonName: z.string().optional(),
  scientificName: z.string().optional(),
  health: z.string().optional(),
  condition: z.string().optional(),
  dbhCm: z.number().optional(),
  heightM: z.number().optional(),
  canopyRadiusM: z.number().optional(),
  estimatedAgeYears: z.number().optional(),
  plantedDate: z.string().optional(),
  notes: z.string().optional(),
  customFields: CustomFieldValues,
});

const UpdateTreeInput = z.object({
  id: z.string().uuid(),
  commonName: z.string().optional(),
  scientificName: z.string().optional(),
  health: z.string().optional(),
  condition: z.string().optional(),
  dbhCm: z.number().optional(),
  heightM: z.number().optional(),
  canopyRadiusM: z.number().optional(),
  estimatedAgeYears: z.number().optional(),
  plantedDate: z.string().optional(),
  notes: z.string().optional(),
  customFields: CustomFieldValues,
});

type TreeListRow = {
  id: string;
  common_name: string | null;
  scientific_name: string | null;
  health: string;
  lng: number;
  lat: number;
};

type TreeDetailRow = {
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
  location_accuracy_m: number | null;
  custom_fields: Record<string, unknown> | null;
  lng: number;
  lat: number;
};

function formatDateOnly(value: string | Date | null): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

export const treesRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    const result = await ctx.tx.execute(sql`
      SELECT id, common_name, scientific_name, health,
             ST_X(location::geometry) AS lng,
             ST_Y(location::geometry) AS lat
      FROM trees
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    const rows = result.rows as TreeListRow[];
    return {
      type: 'FeatureCollection' as const,
      features: rows.map((r) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(r.lng), Number(r.lat)],
        },
        properties: {
          id: r.id,
          commonName: r.common_name,
          scientificName: r.scientific_name,
          health: r.health,
        },
      })),
    };
  }),

  get: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }): Promise<TreeView> => {
      const result = await ctx.tx.execute(sql`
        SELECT id, common_name, scientific_name, health, condition,
               dbh_cm, height_m, canopy_radius_m, estimated_age_years,
               planted_date, notes, location_accuracy_m, custom_fields,
               ST_X(location::geometry) AS lng,
               ST_Y(location::geometry) AS lat
        FROM trees
        WHERE id = ${input.id} AND deleted_at IS NULL
      `);
      const row = result.rows[0] as TreeDetailRow | undefined;
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return {
        id: row.id,
        commonName: row.common_name ?? 'Unknown',
        scientificName: row.scientific_name ?? undefined,
        health: row.health ?? undefined,
        condition: row.condition ?? undefined,
        dbhCm: row.dbh_cm ?? undefined,
        heightM: row.height_m ?? undefined,
        canopyRadiusM: row.canopy_radius_m ?? undefined,
        estimatedAgeYears: row.estimated_age_years ?? undefined,
        plantedDate: formatDateOnly(row.planted_date),
        notes: row.notes ?? undefined,
        customFields: row.custom_fields ?? {},
        location: { lng: Number(row.lng), lat: Number(row.lat) },
        photos: [],
      };
    }),

  update: orgProcedure.input(UpdateTreeInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.tx.execute(sql`
      UPDATE trees SET
        common_name           = ${input.commonName ?? null},
        scientific_name       = ${input.scientificName ?? null},
        health                = ${input.health ?? 'unknown'},
        condition             = ${input.condition ?? 'unknown'},
        dbh_cm                = ${input.dbhCm ?? null},
        height_m              = ${input.heightM ?? null},
        canopy_radius_m       = ${input.canopyRadiusM ?? null},
        estimated_age_years   = ${input.estimatedAgeYears ?? null},
        planted_date          = ${input.plantedDate ?? null},
        notes                 = ${input.notes ?? null},
        custom_fields         = ${JSON.stringify(input.customFields ?? {})}::jsonb,
        updated_by            = current_user_id(),
        updated_at            = now()
      WHERE id = ${input.id} AND deleted_at IS NULL
      RETURNING id
    `);
    const row = result.rows[0] as { id: string } | undefined;
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return { id: row.id };
  }),

  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        UPDATE trees
        SET deleted_at = now(), updated_by = current_user_id()
        WHERE id = ${input.id} AND deleted_at IS NULL
      `);
      return { ok: true };
    }),

  importGeoJson: orgProcedure
    .input(z.object({ features: z.array(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      let imported = 0;
      let skipped = 0;
      for (const feature of input.features) {
        const tree = geoJsonFeatureToTree(feature);
        if (!tree) {
          skipped++;
          continue;
        }
        await insertTreeRow(ctx.tx, tree);
        imported++;
      }
      return { imported, skipped };
    }),

  importCsv: orgProcedure
    .input(z.object({ csv: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rows = parseCsv(input.csv);
      let imported = 0;
      let skipped = 0;
      for (const row of rows) {
        const tree = csvRowToTree(row);
        if (!tree) {
          skipped++;
          continue;
        }
        await insertTreeRow(ctx.tx, tree);
        imported++;
      }
      return { imported, skipped, totalRows: rows.length };
    }),

  create: orgProcedure.input(CreateTreeInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.tx.execute(sql`
      INSERT INTO trees (
        org_id, location, location_accuracy_m, placed_via,
        common_name, scientific_name, health, condition,
        dbh_cm, height_m, canopy_radius_m, estimated_age_years,
        planted_date, notes, custom_fields, created_by, updated_by
      ) VALUES (
        current_org_id(),
        ST_SetSRID(ST_MakePoint(${input.location.lng}, ${input.location.lat}), 4326)::geography,
        ${input.locationAccuracyM ?? null},
        ${input.placedVia},
        ${input.commonName ?? null},
        ${input.scientificName ?? null},
        ${input.health ?? 'unknown'},
        ${input.condition ?? 'unknown'},
        ${input.dbhCm ?? null},
        ${input.heightM ?? null},
        ${input.canopyRadiusM ?? null},
        ${input.estimatedAgeYears ?? null},
        ${input.plantedDate ?? null},
        ${input.notes ?? null},
        ${JSON.stringify(input.customFields ?? {})}::jsonb,
        current_user_id(),
        current_user_id()
      )
      RETURNING id
    `);
    const row = result.rows[0] as { id: string };
    return { id: row.id };
  }),
});
