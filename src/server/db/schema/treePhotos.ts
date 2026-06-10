import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { trees } from './trees';
import { treeInspections } from './treeInspections';
import { organizations } from './orgs';
import { projects } from './projects';
import { users } from './users';

export const treePhotos = pgTable(
  'tree_photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    /** When set, the photo is evidence for this inspection (else a general tree photo). */
    inspectionId: uuid('inspection_id').references(() => treeInspections.id, {
      onDelete: 'set null',
    }),
    storageKey: text('storage_key').notNull(),
    thumbnailKey: text('thumbnail_key'),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    width: integer('width'),
    height: integer('height'),
    caption: text('caption'),
    takenAt: timestamp('taken_at', { withTimezone: true }),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    treeIdx: index('tree_photos_tree_idx').on(t.treeId),
    projectIdx: index('tree_photos_project_idx').on(t.projectId),
    inspectionIdx: index('tree_photos_inspection_idx').on(t.inspectionId),
  }),
);

export type TreePhoto = typeof treePhotos.$inferSelect;
