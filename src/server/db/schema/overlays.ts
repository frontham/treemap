import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './orgs';
import { projects } from './projects';
import { users } from './users';
import type { LngLat } from './columns/geographyPoint';

/** [topLeft, topRight, bottomRight, bottomLeft] in lng/lat. Fed straight to MapLibre's image source. */
export type OverlayCorners = [LngLat, LngLat, LngLat, LngLat];

export const overlays = pgTable(
  'overlays',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    storageKey: text('storage_key').notNull(),
    opacityDefault: real('opacity_default').notNull().default(0.7),
    corners: jsonb('corners').$type<OverlayCorners>().notNull(),
    zIndex: integer('z_index').notNull().default(0),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgIdx: index('overlays_org_idx').on(t.orgId),
    projectIdx: index('overlays_project_idx').on(t.projectId),
  }),
);

export type Overlay = typeof overlays.$inferSelect;
