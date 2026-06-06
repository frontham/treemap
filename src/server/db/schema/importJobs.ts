import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './orgs';
import { projects } from './projects';
import { users } from './users';
import { importStatusEnum } from './enums';

export type ImportStats = {
  totalRows?: number;
  imported?: number;
  skipped?: number;
  failed?: number;
};

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    startedBy: uuid('started_by').references(() => users.id, { onDelete: 'set null' }),
    source: text('source').notNull(),
    status: importStatusEnum('status').notNull().default('pending'),
    stats: jsonb('stats').$type<ImportStats>(),
    error: jsonb('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index('import_jobs_org_idx').on(t.orgId, t.createdAt),
    projectIdx: index('import_jobs_project_idx').on(t.projectId),
  }),
);

export type ImportJob = typeof importJobs.$inferSelect;
