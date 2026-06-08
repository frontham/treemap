-- Make imported assessments (e.g. GeoVisia) first-class inspections:
--   * external inspector provenance on the inspection row, and
--   * a configurable per-project map of which custom fields hold the
--     inspection date / inspector / external id.
ALTER TABLE tree_inspections ADD COLUMN inspector_name text;
ALTER TABLE tree_inspections ADD COLUMN external_ref text;

ALTER TABLE projects ADD COLUMN inspection_mapping jsonb;

-- Pre-seed the Oegstgeest project with its GeoVisia field keys so the existing
-- import can be backfilled into inspections right away.
UPDATE projects
  SET inspection_mapping =
    '{"dateKey":"inspectiedatum","inspectorKey":"controleur","externalIdKey":"gvs_id"}'::jsonb
  WHERE id = '00000000-0000-0000-0000-000000000010';
