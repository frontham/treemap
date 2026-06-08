import { pgTable, uuid, text, jsonb, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { organizations } from './orgs';

/** Which custom-field keys hold inspection metadata (for backfill + imports). */
export type InspectionMapping = {
  dateKey: string | null;
  inspectorKey: string | null;
  externalIdKey: string | null;
};

export type ImportTransform = 'circumferenceToDbh' | 'yearToDate';
/** A saved import mapping: how source columns map onto tree fields. */
export type ImportMapping = {
  lngColumn?: string | null;
  latColumn?: string | null;
  columns: Record<string, { target: string; transform?: ImportTransform }>;
};

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    inspectionMapping: jsonb('inspection_mapping').$type<InspectionMapping>(),
    importMapping: jsonb('import_mapping').$type<ImportMapping>(),
    autoNumber: boolean('auto_number').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgSlugIdx: uniqueIndex('projects_org_slug_idx').on(t.orgId, t.slug),
    orgIdx: index('projects_org_idx').on(t.orgId),
  }),
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
