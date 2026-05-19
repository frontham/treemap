import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { organizations } from './orgs';
import { users } from './users';
import { roleEnum } from './enums';

export const memberships = pgTable(
  'memberships',
  {
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('viewer'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.orgId, t.userId] }),
    userIdx: index('memberships_user_idx').on(t.userId),
  }),
);

export type Membership = typeof memberships.$inferSelect;
export type Role = Membership['role'];
