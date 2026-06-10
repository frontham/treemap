import { z } from 'zod';
import { sql, type SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { projectProcedure } from '../projectProcedure';
import { requireRole } from '../requireRole';
import type { InspectionMapping } from '@/server/db/schema/projects';
import type { TreePhotoView } from '@/components/trees/TreeView';

const editorProcedure = projectProcedure.use(requireRole('editor'));
const adminProcedure = projectProcedure.use(requireRole('admin'));

const EMPTY_MAPPING: InspectionMapping = { dateKey: null, inspectorKey: null, externalIdKey: null };

const HealthEnum = z.enum(['healthy', 'fair', 'poor', 'dead', 'unknown']);
const ConditionEnum = z.enum(['excellent', 'good', 'fair', 'poor', 'critical', 'unknown']);

export type InspectionView = {
  id: string;
  inspectedOn: string | Date;
  health: string;
  condition: string;
  dbhCm: number | null;
  heightM: number | null;
  canopyRadiusM: number | null;
  estimatedAgeYears: number | null;
  notes: string | null;
  customFields: Record<string, unknown>;
  inspectorName: string | null; // external inspector (imports)
  externalRef: string | null;
  userName: string | null; // app user who recorded it
  userEmail: string | null;
  photos: TreePhotoView[]; // evidence photos attached to this inspection
};

const InspectionFields = {
  inspectedOn: z.string(), // YYYY-MM-DD
  health: HealthEnum,
  condition: ConditionEnum,
  dbhCm: z.number().optional(),
  heightM: z.number().optional(),
  canopyRadiusM: z.number().optional(),
  estimatedAgeYears: z.number().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
};

const InspectionInput = z.object({ treeId: z.string().uuid(), ...InspectionFields });
const UpdateInspectionInput = z.object({ id: z.string().uuid(), ...InspectionFields });

/**
 * Re-derive a tree's current condition fields from its newest inspection (by
 * date, then recency). The tree always mirrors the latest assessment, so this
 * runs after any inspection is created, edited, or deleted. If no inspections
 * remain the tree's current values are left untouched (the subquery yields no
 * row, so the UPDATE matches nothing). The audit trigger logs it to history.
 */
function syncTreeFromLatestInspection(treeId: string): SQL {
  return sql`
    UPDATE trees tr SET
      health              = li.health,
      condition           = li.condition,
      dbh_cm              = li.dbh_cm,
      height_m            = li.height_m,
      canopy_radius_m     = li.canopy_radius_m,
      estimated_age_years = li.estimated_age_years,
      notes               = li.notes,
      custom_fields       = li.custom_fields,
      updated_by          = current_user_id(),
      updated_at          = now()
    FROM (
      SELECT health, condition, dbh_cm, height_m, canopy_radius_m,
             estimated_age_years, notes, custom_fields
      FROM tree_inspections
      WHERE tree_id = ${treeId}
      ORDER BY inspected_on DESC, created_at DESC
      LIMIT 1
    ) li
    WHERE tr.id = ${treeId} AND tr.deleted_at IS NULL
      AND (current_project_id() IS NULL OR tr.project_id = current_project_id())
  `;
}

export const inspectionsRouter = router({
  list: projectProcedure
    .input(z.object({ treeId: z.string().uuid() }))
    .query(async ({ ctx, input }): Promise<InspectionView[]> => {
      // Explicit project scoping on read (RLS only fences org), like trees.list.
      const res = await ctx.tx.execute(sql`
        SELECT i.id, i.inspected_on AS "inspectedOn", i.health, i.condition,
               i.dbh_cm AS "dbhCm", i.height_m AS "heightM",
               i.canopy_radius_m AS "canopyRadiusM",
               i.estimated_age_years AS "estimatedAgeYears",
               i.notes, i.custom_fields AS "customFields",
               i.inspector_name AS "inspectorName", i.external_ref AS "externalRef",
               u.name AS "userName", u.email AS "userEmail",
               COALESCE((
                 SELECT json_agg(json_build_object(
                          'id', p.id,
                          'thumbnailUrl', COALESCE(p.thumbnail_key, p.storage_key),
                          'caption', p.caption
                        ) ORDER BY p.uploaded_at DESC)
                 FROM tree_photos p WHERE p.inspection_id = i.id
               ), '[]'::json) AS "photos"
        FROM tree_inspections i
        LEFT JOIN users u ON u.id = i.inspected_by
        WHERE i.tree_id = ${input.treeId}
          AND (current_project_id() IS NULL OR i.project_id = current_project_id())
        ORDER BY i.inspected_on DESC, i.created_at DESC
      `);
      return res.rows as InspectionView[];
    }),

  create: editorProcedure.input(InspectionInput).mutation(async ({ ctx, input }) => {
    const cf = JSON.stringify(input.customFields ?? {});

    // Insert only if the tree is in the active project — guards against
    // attaching an inspection to another project's tree in the same org.
    const ins = await ctx.tx.execute(sql`
      INSERT INTO tree_inspections (
        tree_id, org_id, project_id, inspected_on, inspected_by,
        health, condition, dbh_cm, height_m, canopy_radius_m,
        estimated_age_years, notes, custom_fields
      )
      SELECT t.id, current_org_id(), current_project_id(), ${input.inspectedOn}::date,
             current_user_id(), ${input.health}::tree_health, ${input.condition}::tree_condition,
             ${input.dbhCm ?? null}, ${input.heightM ?? null}, ${input.canopyRadiusM ?? null},
             ${input.estimatedAgeYears ?? null}, ${input.notes ?? null}, ${cf}::jsonb
      FROM trees t
      WHERE t.id = ${input.treeId} AND t.deleted_at IS NULL
        AND (current_project_id() IS NULL OR t.project_id = current_project_id())
      RETURNING id
    `);
    const row = ins.rows[0] as { id: string } | undefined;
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

    // The newest inspection is the current assessment, so reflect it on the tree.
    await ctx.tx.execute(syncTreeFromLatestInspection(input.treeId));

    return { id: row.id };
  }),

  /** Edit any inspection in the active project. Import metadata (inspector_name,
   *  external_ref) and the original recorder (inspected_by) are preserved. */
  update: editorProcedure.input(UpdateInspectionInput).mutation(async ({ ctx, input }) => {
    const cf = JSON.stringify(input.customFields ?? {});
    const upd = await ctx.tx.execute(sql`
      UPDATE tree_inspections SET
        inspected_on        = ${input.inspectedOn}::date,
        health              = ${input.health}::tree_health,
        condition           = ${input.condition}::tree_condition,
        dbh_cm              = ${input.dbhCm ?? null},
        height_m            = ${input.heightM ?? null},
        canopy_radius_m     = ${input.canopyRadiusM ?? null},
        estimated_age_years = ${input.estimatedAgeYears ?? null},
        notes               = ${input.notes ?? null},
        custom_fields       = ${cf}::jsonb
      WHERE id = ${input.id}
        AND (current_project_id() IS NULL OR project_id = current_project_id())
      RETURNING tree_id
    `);
    const row = upd.rows[0] as { tree_id: string } | undefined;
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

    // The edit may have changed which inspection is current (e.g. a new date).
    await ctx.tx.execute(syncTreeFromLatestInspection(row.tree_id));

    return { id: input.id, treeId: row.tree_id };
  }),

  /** Delete any inspection in the active project (hard delete — inspections are
   *  a log, not soft-deletable). The tree falls back to the next-latest. */
  delete: editorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const del = await ctx.tx.execute(sql`
        DELETE FROM tree_inspections
        WHERE id = ${input.id}
          AND (current_project_id() IS NULL OR project_id = current_project_id())
        RETURNING tree_id
      `);
      const row = del.rows[0] as { tree_id: string } | undefined;
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.tx.execute(syncTreeFromLatestInspection(row.tree_id));

      return { ok: true, treeId: row.tree_id };
    }),

  /** The project's custom-field → inspection mapping. */
  mapping: projectProcedure.query(async ({ ctx }): Promise<InspectionMapping> => {
    const res = await ctx.tx.execute(sql`
      SELECT inspection_mapping AS m FROM projects WHERE id = current_project_id()
    `);
    const m = (res.rows[0] as { m: InspectionMapping | null } | undefined)?.m;
    return m ?? EMPTY_MAPPING;
  }),

  setMapping: adminProcedure
    .input(
      z.object({
        dateKey: z.string().nullable(),
        inspectorKey: z.string().nullable(),
        externalIdKey: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        UPDATE projects SET inspection_mapping = ${JSON.stringify(input)}::jsonb
        WHERE id = current_project_id() AND org_id = current_org_id()
      `);
      return { ok: true };
    }),

  /** One-time: turn trees that carry mapped inspection fields into inspection
   *  rows. Idempotent — skips trees that already have an inspection. */
  backfill: adminProcedure.mutation(async ({ ctx }) => {
    const mapRes = await ctx.tx.execute(sql`
      SELECT inspection_mapping AS m FROM projects WHERE id = current_project_id()
    `);
    const mapping = (mapRes.rows[0] as { m: InspectionMapping | null } | undefined)?.m;
    const dateKey = mapping?.dateKey;
    if (!dateKey) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Set an inspection date field first.' });
    }
    const inspectorKey = mapping?.inspectorKey ?? null;
    const externalIdKey = mapping?.externalIdKey ?? null;

    const res = await ctx.tx.execute(sql`
      INSERT INTO tree_inspections (
        tree_id, org_id, project_id, inspected_on, inspector_name, external_ref,
        health, condition, dbh_cm, height_m, canopy_radius_m, estimated_age_years,
        notes, custom_fields
      )
      SELECT t.id, t.org_id, t.project_id,
             (t.custom_fields->>${dateKey})::date,
             ${inspectorKey ? sql`t.custom_fields->>${inspectorKey}` : sql`NULL`},
             ${externalIdKey ? sql`t.custom_fields->>${externalIdKey}` : sql`NULL`},
             t.health, t.condition, t.dbh_cm, t.height_m, t.canopy_radius_m,
             t.estimated_age_years, t.notes, t.custom_fields
      FROM trees t
      WHERE t.project_id = current_project_id()
        AND t.deleted_at IS NULL
        AND t.custom_fields->>${dateKey} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
        AND NOT EXISTS (SELECT 1 FROM tree_inspections i WHERE i.tree_id = t.id)
      RETURNING id
    `);
    return { inserted: res.rows.length };
  }),
});
