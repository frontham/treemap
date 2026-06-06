import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { users } from './users';
import { roleEnum } from './enums';

/**
 * Per-project role override. When a row exists for (project, user), its role is
 * the user's effective role on that project; otherwise the org membership role
 * applies. Reuses the org-level `role` enum.
 */
export const projectMemberships = pgTable(
  'project_memberships',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('viewer'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.userId] }),
    userIdx: index('project_memberships_user_idx').on(t.userId),
  }),
);

export type ProjectMembership = typeof projectMemberships.$inferSelect;
