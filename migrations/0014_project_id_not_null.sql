-- Phase E hardening: every project-scoped row must belong to a project.
-- Safe now that 0011 backfilled existing rows and all writes go through
-- project context. Each ALTER fails loudly (and rolls back) if a NULL remains.
ALTER TABLE trees             ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE overlays          ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE custom_field_defs ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE tree_photos       ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE import_jobs       ALTER COLUMN project_id SET NOT NULL;
