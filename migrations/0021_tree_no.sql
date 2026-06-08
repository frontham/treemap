-- Per-project tree number: seeded from a source id on import (e.g. GeoVisia
-- gvs_id) and optionally auto-incremented for trees added in the app.
ALTER TABLE trees ADD COLUMN tree_no integer;
CREATE UNIQUE INDEX trees_project_no_idx ON trees (project_id, tree_no) WHERE tree_no IS NOT NULL;

-- Per-project toggle: auto-assign the next tree number on create.
ALTER TABLE projects ADD COLUMN auto_number boolean NOT NULL DEFAULT false;
