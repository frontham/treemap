import { pgTable, uuid, real, integer, text, jsonb, date, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './orgs';
import { projects } from './projects';
import { trees } from './trees';
import { users } from './users';
import { treeHealthEnum, treeConditionEnum } from './enums';

/** A dated condition assessment, separate from the per-change audit log. */
export const treeInspections = pgTable(
  'tree_inspections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    inspectedOn: date('inspected_on').notNull(),
    inspectedBy: uuid('inspected_by').references(() => users.id, { onDelete: 'set null' }),
    health: treeHealthEnum('health').notNull().default('unknown'),
    condition: treeConditionEnum('condition').notNull().default('unknown'),
    dbhCm: real('dbh_cm'),
    heightM: real('height_m'),
    canopyRadiusM: real('canopy_radius_m'),
    estimatedAgeYears: integer('estimated_age_years'),
    notes: text('notes'),
    customFields: jsonb('custom_fields').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    treeIdx: index('tree_inspections_tree_idx').on(t.treeId, t.inspectedOn),
    projectIdx: index('tree_inspections_project_idx').on(t.projectId),
  }),
);

export type TreeInspection = typeof treeInspections.$inferSelect;
