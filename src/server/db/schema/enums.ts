import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['owner', 'admin', 'editor', 'viewer']);

export const treeHealthEnum = pgEnum('tree_health', [
  'healthy',
  'fair',
  'poor',
  'dead',
  'unknown',
]);

export const treeConditionEnum = pgEnum('tree_condition', [
  'excellent',
  'good',
  'fair',
  'poor',
  'critical',
  'unknown',
]);

export const placedViaEnum = pgEnum('placed_via', [
  'map_click',
  'current_location',
  'image_overlay',
  'import',
]);

export const customFieldTypeEnum = pgEnum('custom_field_type', [
  'text',
  'number',
  'boolean',
  'select',
  'multiselect',
  'date',
]);

export const importStatusEnum = pgEnum('import_status', [
  'pending',
  'validating',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export const revisionOpEnum = pgEnum('revision_op', [
  'create',
  'update',
  'delete',
  'restore',
]);
