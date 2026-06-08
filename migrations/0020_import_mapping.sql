-- Saved per-project import field mapping (source column -> standard/custom
-- field + optional transform), so repeat imports of the same source reuse it.
ALTER TABLE projects ADD COLUMN import_mapping jsonb;
