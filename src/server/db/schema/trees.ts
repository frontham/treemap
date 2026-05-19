import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  date,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './orgs';
import { users } from './users';
import { species } from './species';
import { treeHealthEnum, treeConditionEnum, placedViaEnum } from './enums';
import { geographyPoint } from './columns/geographyPoint';

export const trees = pgTable(
  'trees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    location: geographyPoint('location').notNull(),
    locationAccuracyM: real('location_accuracy_m'),
    placedVia: placedViaEnum('placed_via').notNull(),
    speciesId: uuid('species_id').references(() => species.id, { onDelete: 'set null' }),
    commonName: text('common_name'),
    scientificName: text('scientific_name'),
    health: treeHealthEnum('health').notNull().default('unknown'),
    condition: treeConditionEnum('condition').notNull().default('unknown'),
    estimatedAgeYears: integer('estimated_age_years'),
    dbhCm: real('dbh_cm'),
    heightM: real('height_m'),
    canopyRadiusM: real('canopy_radius_m'),
    plantedDate: date('planted_date'),
    notes: text('notes'),
    customFields: jsonb('custom_fields')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    orgIdx: index('trees_org_idx').on(t.orgId),
    // GIST spatial index on location is added in 0002_indexes_and_rls.sql
  }),
);

export type Tree = typeof trees.$inferSelect;
export type NewTree = typeof trees.$inferInsert;
