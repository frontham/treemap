import { pgTable, uuid, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { trees } from './trees';
import { users } from './users';
import { revisionOpEnum } from './enums';

export const treeRevisions = pgTable(
  'tree_revisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
    operation: revisionOpEnum('operation').notNull(),
    diff: jsonb('diff').notNull(),
  },
  (t) => ({
    treeIdx: index('tree_revisions_tree_idx').on(t.treeId, t.changedAt),
  }),
);

export type TreeRevision = typeof treeRevisions.$inferSelect;
