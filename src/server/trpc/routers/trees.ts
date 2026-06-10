import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { projectProcedure } from '../projectProcedure';
import { requireRole } from '../requireRole';
import type { TreeView, TreePhotoView } from '@/components/trees/TreeView';
import { insertTreeRow } from '@/server/imports/insertTreeRow';
import { geoJsonFeatureToTree } from '@/server/imports/geoJsonFeatureToTree';
import { csvRowToTree } from '@/server/imports/csvRowToTree';
import { parseCsv } from '@/server/imports/parseCsv';
import { applyRigid } from '@/lib/geo/rigidTransform';

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
  risk: z.string().optional(),
  nextInspectionOn: z.string().optional(),
  treeNo: z.number().optional(),
  dbhCm: z.number().optional(),
  heightM: z.number().optional(),
  canopyRadiusM: z.number().optional(),
  estimatedAgeYears: z.number().optional(),
  plantedDate: z.string().optional(),
  notes: z.string().optional(),
  customFields: CustomFieldValues,
});

// Tree edits are identity-only. Condition, measurements, notes and custom
// fields are owned by inspections (the tree row mirrors the latest one via
// syncTreeFromLatestInspection), so editing them here would just be overwritten
// — they're changed by logging/editing an inspection instead.
const UpdateTreeInput = z.object({
  id: z.string().uuid(),
  commonName: z.string().optional(),
  scientificName: z.string().optional(),
  risk: z.string().optional(),
  nextInspectionOn: z.string().optional(),
  plantedDate: z.string().optional(),
});

const AddPhotoInput = z.object({
  treeId: z.string().uuid(),
  // When set, the photo is attached as evidence for this inspection.
  inspectionId: z.string().uuid().optional(),
  // Downscaled JPEG data URLs produced client-side by processImage().
  storageKey: z.string().min(1),
  thumbnailKey: z.string().min(1),
  mimeType: z.string().default('image/jpeg'),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  caption: z.string().max(500).optional(),
});

type TreeListRow = {
  id: string;
  common_name: string | null;
  scientific_name: string | null;
  health: string;
  condition: string;
  risk: string;
  tree_no: number | null;
  lng: number;
  lat: number;
};

type TreeDetailRow = {
  id: string;
  common_name: string | null;
  scientific_name: string | null;
  health: string | null;
  condition: string | null;
  risk: string | null;
  next_inspection_on: string | Date | null;
  tree_no: number | null;
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
  last_inspected_on: string | Date | null;
};

type TreePhotoRow = {
  id: string;
  thumbnail_key: string | null;
  storage_key: string;
  caption: string | null;
};

function formatDateOnly(value: string | Date | null): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

/** Mutations require at least editor on the active project. */
const editorProcedure = projectProcedure.use(requireRole('editor'));

/** Bulk re-georeference is an admin-level operation (moves every tree). */
const adminProcedure = projectProcedure.use(requireRole('admin'));

const CalibrateInput = z.object({
  dx: z.number(), // metres east(+)/west(−)
  dy: z.number(), // metres north(+)/south(−)
  angleDeg: z.number(), // counter-clockwise degrees
  scale: z.number().positive().default(1), // 1 = unchanged
  pivotLng: z.number(),
  pivotLat: z.number(),
});

export type RevisionView = {
  id: string;
  changedAt: string | Date;
  operation: 'create' | 'update' | 'delete' | 'restore';
  /** create/delete: full row snapshot; update: { column: { from, to } }. */
  diff: Record<string, unknown>;
  authorName: string | null;
  authorEmail: string | null;
};

export const treesRouter = router({
  list: projectProcedure.query(async ({ ctx }) => {
    const result = await ctx.tx.execute(sql`
      SELECT id, common_name, scientific_name, health, condition, risk, tree_no,
             ST_X(location::geometry) AS lng,
             ST_Y(location::geometry) AS lat
      FROM trees
      WHERE deleted_at IS NULL
        AND (current_project_id() IS NULL OR project_id = current_project_id())
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
          condition: r.condition,
          risk: r.risk,
          treeNo: r.tree_no,
        },
      })),
    };
  }),

  get: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }): Promise<TreeView> => {
      const result = await ctx.tx.execute(sql`
        SELECT t.id, t.common_name, t.scientific_name, t.health, t.condition,
               t.risk, t.next_inspection_on, t.tree_no,
               t.dbh_cm, t.height_m, t.canopy_radius_m, t.estimated_age_years,
               t.planted_date, t.notes, t.location_accuracy_m, t.custom_fields,
               ST_X(t.location::geometry) AS lng,
               ST_Y(t.location::geometry) AS lat,
               (SELECT max(i.inspected_on) FROM tree_inspections i WHERE i.tree_id = t.id)
                 AS last_inspected_on
        FROM trees t
        WHERE t.id = ${input.id} AND t.deleted_at IS NULL
          AND (current_project_id() IS NULL OR t.project_id = current_project_id())
      `);
      const row = result.rows[0] as TreeDetailRow | undefined;
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

      // Photos ship as thumbnails only — the full-size data URL is fetched on
      // demand by the lightbox (trees.photo) so the drawer payload stays small.
      // Only general (unlinked) photos here; inspection-linked photos are
      // returned per inspection by inspections.list.
      const photosResult = await ctx.tx.execute(sql`
        SELECT id, thumbnail_key, storage_key, caption
        FROM tree_photos
        WHERE tree_id = ${input.id}
          AND inspection_id IS NULL
          AND (current_project_id() IS NULL OR project_id = current_project_id())
        ORDER BY uploaded_at DESC
      `);
      const photos = (photosResult.rows as TreePhotoRow[]).map((p) => ({
        id: p.id,
        thumbnailUrl: p.thumbnail_key ?? p.storage_key,
        caption: p.caption ?? undefined,
      }));

      // The inspection the tree currently mirrors (same ordering as
      // syncTreeFromLatestInspection), with its evidence photos as thumbnails —
      // shown read-only on Details so the snapshot keeps its supporting photos.
      const latestResult = await ctx.tx.execute(sql`
        SELECT i.id, i.inspected_on,
               COALESCE((
                 SELECT json_agg(json_build_object(
                          'id', p.id,
                          'thumbnailUrl', COALESCE(p.thumbnail_key, p.storage_key),
                          'caption', p.caption
                        ) ORDER BY p.uploaded_at DESC)
                 FROM tree_photos p WHERE p.inspection_id = i.id
               ), '[]'::json) AS photos
        FROM tree_inspections i
        WHERE i.tree_id = ${input.id}
          AND (current_project_id() IS NULL OR i.project_id = current_project_id())
        ORDER BY i.inspected_on DESC, i.created_at DESC
        LIMIT 1
      `);
      const latestRow = latestResult.rows[0] as
        | { id: string; inspected_on: string | Date; photos: TreePhotoView[] }
        | undefined;
      const latestInspection = latestRow
        ? {
            id: latestRow.id,
            inspectedOn: formatDateOnly(latestRow.inspected_on) ?? '',
            photos: latestRow.photos,
          }
        : undefined;

      return {
        id: row.id,
        commonName: row.common_name ?? 'Unknown',
        scientificName: row.scientific_name ?? undefined,
        health: row.health ?? undefined,
        condition: row.condition ?? undefined,
        risk: row.risk ?? undefined,
        nextInspectionOn: formatDateOnly(row.next_inspection_on),
        treeNo: row.tree_no ?? undefined,
        dbhCm: row.dbh_cm ?? undefined,
        heightM: row.height_m ?? undefined,
        canopyRadiusM: row.canopy_radius_m ?? undefined,
        estimatedAgeYears: row.estimated_age_years ?? undefined,
        plantedDate: formatDateOnly(row.planted_date),
        notes: row.notes ?? undefined,
        customFields: row.custom_fields ?? {},
        location: { lng: Number(row.lng), lat: Number(row.lat) },
        lastInspectedOn: formatDateOnly(row.last_inspected_on),
        photos,
        latestInspection,
      };
    }),

  /** Full-size image (data URL) for one photo — loaded by the lightbox on open. */
  photo: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.tx.execute(sql`
        SELECT id, storage_key, caption, width, height, mime_type
        FROM tree_photos
        WHERE id = ${input.id}
          AND (current_project_id() IS NULL OR project_id = current_project_id())
      `);
      const row = result.rows[0] as
        | {
            id: string;
            storage_key: string;
            caption: string | null;
            width: number | null;
            height: number | null;
            mime_type: string;
          }
        | undefined;
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return {
        id: row.id,
        url: row.storage_key,
        caption: row.caption ?? undefined,
        width: row.width ?? undefined,
        height: row.height ?? undefined,
        mimeType: row.mime_type,
      };
    }),

  /**
   * Manually re-georeference the whole project: translate (metres) + rotate
   * (about a pivot) every non-deleted tree. Uses the same applyRigid math as the
   * client preview so the saved result matches exactly what was shown on the map.
   * Each row update is logged to tree_revisions by the audit trigger (reversible).
   */
  calibrate: adminProcedure.input(CalibrateInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.tx.execute(sql`
      SELECT id, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
      FROM trees
      WHERE deleted_at IS NULL
        AND (current_project_id() IS NULL OR project_id = current_project_id())
    `);
    const rows = result.rows as { id: string; lng: number; lat: number }[];
    const payload = rows.map((r) => {
      const [lng, lat] = applyRigid(Number(r.lng), Number(r.lat), input);
      return { id: r.id, lng, lat };
    });
    if (payload.length === 0) return { updated: 0 };
    // json_to_recordset binds reliably through Drizzle (array params via unnest do not).
    const json = JSON.stringify(payload);
    const upd = await ctx.tx.execute(sql`
      UPDATE trees t SET
        location   = ST_SetSRID(ST_MakePoint(d.lng, d.lat), 4326)::geography,
        updated_by = current_user_id(),
        updated_at = now()
      FROM json_to_recordset(${json}::json) AS d(id uuid, lng float8, lat float8)
      WHERE t.id = d.id
    `);
    return { updated: upd.rowCount ?? payload.length };
  }),

  /** Identity-only edit (see UpdateTreeInput). Condition/measurements/notes/
   *  custom fields are deliberately not touched — those are inspection-owned. */
  update: editorProcedure.input(UpdateTreeInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.tx.execute(sql`
      UPDATE trees SET
        common_name           = ${input.commonName ?? null},
        scientific_name       = ${input.scientificName ?? null},
        risk                  = ${input.risk ?? 'unknown'}::tree_risk,
        next_inspection_on    = ${input.nextInspectionOn ?? null}::date,
        planted_date          = ${input.plantedDate ?? null},
        updated_by            = current_user_id(),
        updated_at            = now()
      WHERE id = ${input.id} AND deleted_at IS NULL
      RETURNING id
    `);
    const row = result.rows[0] as { id: string } | undefined;
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return { id: row.id };
  }),

  /** Move a single tree. Location-only so it can't clobber other fields; the
   *  audit trigger logs it to tree_revisions (reversible). */
  move: editorProcedure
    .input(z.object({ id: z.string().uuid(), lng: z.number(), lat: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.tx.execute(sql`
        UPDATE trees SET
          location   = ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography,
          updated_by = current_user_id(),
          updated_at = now()
        WHERE id = ${input.id} AND deleted_at IS NULL
        RETURNING id
      `);
      const row = result.rows[0] as { id: string } | undefined;
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return { id: row.id };
    }),

  /** Change log for one tree, newest first (from the audit trigger). */
  history: projectProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }): Promise<RevisionView[]> => {
      // Scope to the active project explicitly: RLS only fences by org on reads
      // (project is pinned on writes), so we constrain project_id here like
      // trees.list / overlays.list do — otherwise another project's tree id in
      // the same org would leak its history.
      const res = await ctx.tx.execute(sql`
        SELECT r.id, r.changed_at AS "changedAt", r.operation, r.diff,
               u.name AS "authorName", u.email AS "authorEmail"
        FROM tree_revisions r
        JOIN trees t ON t.id = r.tree_id
        LEFT JOIN users u ON u.id = r.changed_by
        WHERE r.tree_id = ${input.id}
          AND (current_project_id() IS NULL OR t.project_id = current_project_id())
        ORDER BY r.changed_at DESC
      `);
      return res.rows as RevisionView[];
    }),

  delete: editorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        UPDATE trees
        SET deleted_at = now(), updated_by = current_user_id()
        WHERE id = ${input.id} AND deleted_at IS NULL
      `);
      return { ok: true };
    }),

  /**
   * Attach a photo to a tree, optionally as evidence for one of its inspections.
   * INSERT…SELECT from trees so a photo can only attach to a tree in the active
   * project (no match → NOT_FOUND); when an inspectionId is given it must belong
   * to that same tree. org_id/project_id are forced to the pinned tenant so RLS
   * WITH CHECK passes.
   */
  addPhoto: editorProcedure.input(AddPhotoInput).mutation(async ({ ctx, input }) => {
    const inspectionId = input.inspectionId ?? null;
    const result = await ctx.tx.execute(sql`
      INSERT INTO tree_photos (
        tree_id, org_id, project_id, inspection_id, storage_key, thumbnail_key,
        mime_type, size_bytes, width, height, caption, uploaded_by
      )
      SELECT t.id, current_org_id(), current_project_id(), ${inspectionId}::uuid,
             ${input.storageKey}, ${input.thumbnailKey}, ${input.mimeType},
             ${input.sizeBytes}, ${input.width ?? null}, ${input.height ?? null},
             ${input.caption ?? null}, current_user_id()
      FROM trees t
      WHERE t.id = ${input.treeId} AND t.deleted_at IS NULL
        AND (current_project_id() IS NULL OR t.project_id = current_project_id())
        AND (
          ${inspectionId}::uuid IS NULL
          OR EXISTS (
            SELECT 1 FROM tree_inspections i
            WHERE i.id = ${inspectionId}::uuid AND i.tree_id = t.id
          )
        )
      RETURNING id
    `);
    const photo = result.rows[0] as { id: string } | undefined;
    if (!photo) throw new TRPCError({ code: 'NOT_FOUND' });
    return { id: photo.id };
  }),

  deletePhoto: editorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.tx.execute(sql`
        DELETE FROM tree_photos
        WHERE id = ${input.id}
          AND (current_project_id() IS NULL OR project_id = current_project_id())
        RETURNING id
      `);
      if (!result.rows[0]) throw new TRPCError({ code: 'NOT_FOUND' });
      return { ok: true };
    }),

  importGeoJson: editorProcedure
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

  importCsv: editorProcedure
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

  create: editorProcedure.input(CreateTreeInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.tx.execute(sql`
      INSERT INTO trees (
        org_id, project_id, location, location_accuracy_m, placed_via,
        common_name, scientific_name, health, condition, risk, next_inspection_on, tree_no,
        dbh_cm, height_m, canopy_radius_m, estimated_age_years,
        planted_date, notes, custom_fields, created_by, updated_by
      ) VALUES (
        current_org_id(),
        current_project_id(),
        ST_SetSRID(ST_MakePoint(${input.location.lng}, ${input.location.lat}), 4326)::geography,
        ${input.locationAccuracyM ?? null},
        ${input.placedVia},
        ${input.commonName ?? null},
        ${input.scientificName ?? null},
        ${input.health ?? 'unknown'},
        ${input.condition ?? 'unknown'},
        ${input.risk ?? 'unknown'}::tree_risk,
        ${input.nextInspectionOn ?? null}::date,
        COALESCE(
          ${input.treeNo ?? null},
          CASE WHEN (SELECT auto_number FROM projects WHERE id = current_project_id())
               THEN (SELECT COALESCE(MAX(tree_no), 0) + 1 FROM trees WHERE project_id = current_project_id())
               ELSE NULL END
        ),
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

    // If the create form captured any condition info, record it as the tree's
    // first dated assessment (today) so it shows in the timeline rather than
    // sitting as an orphaned value on the tree row. The tree row already holds
    // these same values, so no re-sync is needed. Quick placements that leave
    // condition blank/unknown create no inspection.
    const hasAssessment =
      (input.health != null && input.health !== 'unknown') ||
      (input.condition != null && input.condition !== 'unknown') ||
      input.dbhCm != null ||
      input.heightM != null ||
      input.canopyRadiusM != null ||
      input.estimatedAgeYears != null ||
      (input.notes != null && input.notes !== '') ||
      (input.customFields != null && Object.keys(input.customFields).length > 0);

    if (hasAssessment) {
      await ctx.tx.execute(sql`
        INSERT INTO tree_inspections (
          tree_id, org_id, project_id, inspected_on, inspected_by,
          health, condition, dbh_cm, height_m, canopy_radius_m,
          estimated_age_years, notes, custom_fields
        ) VALUES (
          ${row.id}, current_org_id(), current_project_id(), CURRENT_DATE, current_user_id(),
          ${input.health ?? 'unknown'}::tree_health,
          ${input.condition ?? 'unknown'}::tree_condition,
          ${input.dbhCm ?? null}, ${input.heightM ?? null}, ${input.canopyRadiusM ?? null},
          ${input.estimatedAgeYears ?? null}, ${input.notes ?? null},
          ${JSON.stringify(input.customFields ?? {})}::jsonb
        )
      `);
    }

    return { id: row.id };
  }),
});
