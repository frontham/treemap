import { z } from 'zod';
import { sql, type SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router } from '../init';
import { projectProcedure } from '../projectProcedure';
import { requireRole } from '../requireRole';
import { parseCsv } from '@/server/imports/parseCsv';
import { insertTreeRow, type ImportTreeValues } from '@/server/imports/insertTreeRow';
import type { ImportMapping } from '@/server/db/schema/projects';

const editorProcedure = projectProcedure.use(requireRole('editor'));
const adminProcedure = projectProcedure.use(requireRole('admin'));

/** Standard tree fields a source column can map onto (besides custom/ignore). */
const STANDARD_FIELDS = new Set([
  'commonName',
  'scientificName',
  'health',
  'condition',
  'risk',
  'dbhCm',
  'heightM',
  'canopyRadiusM',
  'estimatedAgeYears',
  'plantedDate',
  'nextInspectionOn',
  'notes',
  'treeNo',
]);
const NUMERIC_FIELDS = new Set(['dbhCm', 'heightM', 'canopyRadiusM', 'estimatedAgeYears', 'treeNo']);

/** target field -> DB column + how to coerce/cast it (for the existing-data remap). */
const FIELD_DEFS: Record<
  string,
  { col: string; kind: 'text' | 'number' | 'date' | 'enum'; enumType?: string; enumValues?: Set<string> }
> = {
  commonName: { col: 'common_name', kind: 'text' },
  scientificName: { col: 'scientific_name', kind: 'text' },
  notes: { col: 'notes', kind: 'text' },
  health: { col: 'health', kind: 'enum', enumType: 'tree_health', enumValues: new Set(['healthy', 'fair', 'poor', 'dead', 'unknown']) },
  condition: { col: 'condition', kind: 'enum', enumType: 'tree_condition', enumValues: new Set(['excellent', 'good', 'fair', 'poor', 'critical', 'unknown']) },
  risk: { col: 'risk', kind: 'enum', enumType: 'tree_risk', enumValues: new Set(['low', 'moderate', 'high', 'unknown']) },
  dbhCm: { col: 'dbh_cm', kind: 'number' },
  heightM: { col: 'height_m', kind: 'number' },
  canopyRadiusM: { col: 'canopy_radius_m', kind: 'number' },
  estimatedAgeYears: { col: 'estimated_age_years', kind: 'number' },
  treeNo: { col: 'tree_no', kind: 'number' },
  plantedDate: { col: 'planted_date', kind: 'date' },
  nextInspectionOn: { col: 'next_inspection_on', kind: 'date' },
};

/** Build a `column = value` fragment for an in-place remap; null = skip (e.g. invalid enum value). */
function standardSet(target: string, value: unknown): SQL | null {
  if (value == null || value === '') return null;
  const d = FIELD_DEFS[target];
  if (!d) return null;
  if (d.kind === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? sql`${sql.identifier(d.col)} = ${n}` : null;
  }
  if (d.kind === 'enum') {
    const v = String(value);
    if (!d.enumValues!.has(v)) return null;
    return sql`${sql.identifier(d.col)} = ${v}::${sql.raw(d.enumType!)}`;
  }
  if (d.kind === 'date') return sql`${sql.identifier(d.col)} = ${String(value)}::date`;
  return sql`${sql.identifier(d.col)} = ${String(value)}`;
}

const TransformEnum = z.enum(['circumferenceToDbh', 'yearToDate']);

const MappingSchema = z.object({
  lngColumn: z.string().nullable().optional(),
  latColumn: z.string().nullable().optional(),
  columns: z.record(
    z.string(),
    z.object({ target: z.string(), transform: TransformEnum.optional() }),
  ),
});

function applyTransform(raw: unknown, transform?: z.infer<typeof TransformEnum>): unknown {
  if (raw == null || raw === '') return raw;
  if (transform === 'circumferenceToDbh') {
    const m = Number(raw); // stem circumference in metres
    return Number.isFinite(m) ? (m * 100) / Math.PI : null; // → DBH in cm
  }
  if (transform === 'yearToDate') {
    const y = parseInt(String(raw), 10);
    return Number.isFinite(y) && y > 1000 ? `${y}-01-01` : null;
  }
  return raw;
}

function assignStandard(tree: ImportTreeValues, target: string, value: unknown) {
  if (NUMERIC_FIELDS.has(target)) {
    const n = Number(value);
    if (Number.isFinite(n)) (tree as Record<string, unknown>)[target] = n;
  } else {
    (tree as Record<string, unknown>)[target] = String(value);
  }
}

export const importsRouter = router({
  /** The project's saved import mapping, for prefilling the dialog. */
  mapping: projectProcedure.query(async ({ ctx }): Promise<ImportMapping | null> => {
    const res = await ctx.tx.execute(sql`
      SELECT import_mapping AS m FROM projects WHERE id = current_project_id()
    `);
    return (res.rows[0] as { m: ImportMapping | null } | undefined)?.m ?? null;
  }),

  run: editorProcedure
    .input(
      z.object({
        source: z.discriminatedUnion('kind', [
          z.object({ kind: z.literal('csv'), csv: z.string() }),
          z.object({ kind: z.literal('geojson'), features: z.array(z.unknown()) }),
        ]),
        mapping: MappingSchema,
        save: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { source, mapping, save } = input;

      // Normalize to records + a lng/lat resolver.
      let records: Record<string, unknown>[];
      let resolve: (r: Record<string, unknown>) => { lng: number; lat: number } | null;
      if (source.kind === 'csv') {
        records = parseCsv(source.csv);
        resolve = (r) => {
          const lng = Number(r[mapping.lngColumn ?? '']);
          const lat = Number(r[mapping.latColumn ?? '']);
          return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
        };
      } else {
        records = source.features.map((f) => {
          const feat = f as { properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } };
          const coords = feat?.geometry?.coordinates;
          const lng = Array.isArray(coords) ? Number(coords[0]) : NaN;
          const lat = Array.isArray(coords) ? Number(coords[1]) : NaN;
          return { ...(feat?.properties ?? {}), __lng: lng, __lat: lat };
        });
        resolve = (r) => {
          const lng = Number(r.__lng);
          const lat = Number(r.__lat);
          return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
        };
      }

      // Auto-create defs for columns mapped to custom (idempotent).
      const customCols = Object.entries(mapping.columns)
        .filter(([, m]) => m.target === 'custom')
        .map(([c]) => c);
      for (const col of customCols) {
        await ctx.tx.execute(sql`
          INSERT INTO custom_field_defs (org_id, project_id, key, label, type, required, display_order)
          VALUES (current_org_id(), current_project_id(), ${col}, ${col}, 'text'::custom_field_type, false, 100)
          ON CONFLICT (project_id, key) DO NOTHING
        `);
      }

      let imported = 0;
      let skipped = 0;
      for (const r of records) {
        const ll = resolve(r);
        if (!ll) {
          skipped++;
          continue;
        }
        const tree: ImportTreeValues = { lng: ll.lng, lat: ll.lat, customFields: {} };
        for (const [col, m] of Object.entries(mapping.columns)) {
          if (m.target === 'ignore') continue;
          const value = applyTransform(r[col], m.transform);
          if (value == null || value === '') continue;
          if (m.target === 'custom') {
            tree.customFields![col] = value;
          } else if (STANDARD_FIELDS.has(m.target)) {
            assignStandard(tree, m.target, value);
          }
        }
        await insertTreeRow(ctx.tx, tree);
        imported++;
      }

      if (save) {
        await ctx.tx.execute(sql`
          UPDATE projects SET import_mapping = ${JSON.stringify(mapping)}::jsonb
          WHERE id = current_project_id() AND org_id = current_org_id()
        `);
      }

      return { imported, skipped };
    }),

  /** Save the project's import/field mapping (configured in settings). */
  setMapping: adminProcedure.input(MappingSchema).mutation(async ({ ctx, input }) => {
    await ctx.tx.execute(sql`
      UPDATE projects SET import_mapping = ${JSON.stringify(input)}::jsonb
      WHERE id = current_project_id() AND org_id = current_org_id()
    `);
    return { ok: true };
  }),

  /** Whether new trees auto-increment a per-project tree number. */
  options: projectProcedure.query(async ({ ctx }) => {
    const res = await ctx.tx.execute(sql`
      SELECT auto_number AS "autoNumber" FROM projects WHERE id = current_project_id()
    `);
    return { autoNumber: !!(res.rows[0] as { autoNumber: boolean } | undefined)?.autoNumber };
  }),

  setAutoNumber: adminProcedure
    .input(z.object({ autoNumber: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tx.execute(sql`
        UPDATE projects SET auto_number = ${input.autoNumber}
        WHERE id = current_project_id() AND org_id = current_org_id()
      `);
      return { ok: true };
    }),

  /** Apply the saved mapping to existing trees: backfill standard fields from
   *  each tree's custom_fields (same transforms as import). Copies, re-runnable. */
  remapExisting: adminProcedure.mutation(async ({ ctx }) => {
    const mapRes = await ctx.tx.execute(sql`
      SELECT import_mapping AS m FROM projects WHERE id = current_project_id()
    `);
    const mapping = (mapRes.rows[0] as { m: ImportMapping | null } | undefined)?.m;
    if (!mapping?.columns) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Configure and save a mapping first.' });
    }
    const standardEntries = Object.entries(mapping.columns).filter(([, m]) =>
      STANDARD_FIELDS.has(m.target),
    );
    if (standardEntries.length === 0) return { updated: 0 };

    const treesRes = await ctx.tx.execute(sql`
      SELECT id, custom_fields FROM trees
      WHERE project_id = current_project_id() AND deleted_at IS NULL
    `);
    let updated = 0;
    for (const row of treesRes.rows as { id: string; custom_fields: Record<string, unknown> | null }[]) {
      const cf = row.custom_fields ?? {};
      const sets: SQL[] = [];
      for (const [key, m] of standardEntries) {
        const frag = standardSet(m.target, applyTransform(cf[key], m.transform));
        if (frag) sets.push(frag);
      }
      if (sets.length === 0) continue;
      await ctx.tx.execute(sql`
        UPDATE trees SET ${sql.join(sets, sql`, `)}, updated_by = current_user_id(), updated_at = now()
        WHERE id = ${row.id} AND project_id = current_project_id()
      `);
      updated++;
    }
    return { updated };
  }),
});
