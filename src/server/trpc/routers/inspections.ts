import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { projectProcedure } from '../projectProcedure';
import { requireRole } from '../requireRole';

const editorProcedure = projectProcedure.use(requireRole('editor'));

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
  inspectorName: string | null;
  inspectorEmail: string | null;
};

const InspectionInput = z.object({
  treeId: z.string().uuid(),
  inspectedOn: z.string(), // YYYY-MM-DD
  health: HealthEnum,
  condition: ConditionEnum,
  dbhCm: z.number().optional(),
  heightM: z.number().optional(),
  canopyRadiusM: z.number().optional(),
  estimatedAgeYears: z.number().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

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
               u.name AS "inspectorName", u.email AS "inspectorEmail"
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

    // The latest inspection is the current assessment, so reflect its values on
    // the tree (the audit trigger records this as a normal edit in history).
    await ctx.tx.execute(sql`
      UPDATE trees SET
        health              = ${input.health}::tree_health,
        condition           = ${input.condition}::tree_condition,
        dbh_cm              = ${input.dbhCm ?? null},
        height_m            = ${input.heightM ?? null},
        canopy_radius_m     = ${input.canopyRadiusM ?? null},
        estimated_age_years = ${input.estimatedAgeYears ?? null},
        notes               = ${input.notes ?? null},
        custom_fields       = ${cf}::jsonb,
        updated_by          = current_user_id(),
        updated_at          = now()
      WHERE id = ${input.treeId} AND deleted_at IS NULL
        AND (current_project_id() IS NULL OR project_id = current_project_id())
    `);

    return { id: row.id };
  }),
});
