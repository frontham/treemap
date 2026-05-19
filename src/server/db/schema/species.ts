import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './orgs';

export const species = pgTable(
  'species',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
    scientificName: text('scientific_name').notNull(),
    commonName: text('common_name'),
    family: text('family'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('species_org_idx').on(t.orgId),
  }),
);

export type Species = typeof species.$inferSelect;
