import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './orgs';
import { customFieldTypeEnum } from './enums';

export const customFieldDefs = pgTable(
  'custom_field_defs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    label: text('label').notNull(),
    type: customFieldTypeEnum('type').notNull(),
    options: jsonb('options').$type<string[] | null>(),
    required: boolean('required').notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgKeyIdx: uniqueIndex('custom_field_defs_org_key_idx').on(t.orgId, t.key),
  }),
);

export type CustomFieldDef = typeof customFieldDefs.$inferSelect;
