import { sql } from 'drizzle-orm';
import { router } from '../init';
import { orgProcedure } from '../orgProcedure';

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

export const customFieldsRouter = router({
  list: orgProcedure.query(async ({ ctx }): Promise<CustomFieldDefView[]> => {
    const result = await ctx.tx.execute(sql`
      SELECT id, key, label, type, options, required, display_order
      FROM custom_field_defs
      WHERE archived_at IS NULL
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
});
