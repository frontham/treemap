import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { projectProcedure } from '../projectProcedure';
import { requireRole } from '../requireRole';

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'date';

export type CustomFieldDefView = {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  options: string[] | null;
  required: boolean;
  displayOrder: number;
};

type CustomFieldRow = {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  options: string[] | null;
  required: boolean;
  display_order: number;
};

const FieldType = z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'date']);

/** Managing a project's field schema requires admin on the project. */
const adminProcedure = projectProcedure.use(requireRole('admin'));

export const customFieldsRouter = router({
  list: projectProcedure.query(async ({ ctx }): Promise<CustomFieldDefView[]> => {
    const result = await ctx.tx.execute(sql`
      SELECT id, key, label, type, options, required, display_order
      FROM custom_field_defs
      WHERE archived_at IS NULL
        AND (current_project_id() IS NULL OR project_id = current_project_id())
      ORDER BY display_order, label
    `);
    const rows = result.rows as CustomFieldRow[];
    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label,
      type: r.type,
      options: r.options,
      required: r.required,
      displayOrder: r.display_order,
    }));
  }),

  create: adminProcedure
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .regex(/^[a-z0-9_]+$/, 'lowercase letters, numbers and underscores only'),
        label: z.string().min(1),
        type: FieldType,
        options: z.array(z.string()).nullish(),
        required: z.boolean().default(false),
        displayOrder: z.number().int().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.tx.execute(sql`
        INSERT INTO custom_field_defs (org_id, project_id, key, label, type, options, required, display_order)
        VALUES (current_org_id(), current_project_id(), ${input.key}, ${input.label},
          ${input.type}::custom_field_type,
          ${input.options ? JSON.stringify(input.options) : null}::jsonb,
          ${input.required}, ${input.displayOrder})
        ON CONFLICT (project_id, key) DO UPDATE SET
          label = excluded.label, type = excluded.type, options = excluded.options,
          required = excluded.required, display_order = excluded.display_order,
          archived_at = NULL
        RETURNING id
      `);
      const row = result.rows[0] as { id: string } | undefined;
      if (!row) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return { id: row.id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().min(1),
        options: z.array(z.string()).nullish(),
        required: z.boolean().default(false),
        displayOrder: z.number().int().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.tx.execute(sql`
        UPDATE custom_field_defs SET
          label = ${input.label},
          options = ${input.options ? JSON.stringify(input.options) : null}::jsonb,
          required = ${input.required},
          display_order = ${input.displayOrder}
        WHERE id = ${input.id}
          AND (current_project_id() IS NULL OR project_id = current_project_id())
        RETURNING id
      `);
      const row = result.rows[0] as { id: string } | undefined;
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return { id: row.id };
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        UPDATE custom_field_defs SET archived_at = now()
        WHERE id = ${input.id}
          AND (current_project_id() IS NULL OR project_id = current_project_id())
      `);
      return { ok: true };
    }),
});
