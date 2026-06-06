-- Add a nullable project_id to every org-scoped data table. Nullable for now so
-- this migration is non-destructive; backfilled in 0011 and (optionally) made
-- NOT NULL in a later migration once verified.
ALTER TABLE trees ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX trees_project_idx ON trees (project_id);

ALTER TABLE tree_photos ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX tree_photos_project_idx ON tree_photos (project_id);

ALTER TABLE overlays ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX overlays_project_idx ON overlays (project_id);

ALTER TABLE custom_field_defs ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX custom_field_defs_project_idx ON custom_field_defs (project_id);

ALTER TABLE import_jobs ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
CREATE INDEX import_jobs_project_idx ON import_jobs (project_id);
