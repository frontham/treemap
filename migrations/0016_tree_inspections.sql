-- Inspection log: a deliberate, dated condition assessment per tree, distinct
-- from the automatic per-change audit trail (tree_revisions). Project-scoped
-- like trees: org is the hard fence on reads (USING), org + active project on
-- writes (WITH CHECK).
CREATE TABLE tree_inspections (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id              uuid NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  org_id               uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id           uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inspected_on         date NOT NULL,
  inspected_by         uuid REFERENCES users(id) ON DELETE SET NULL,
  health               tree_health NOT NULL DEFAULT 'unknown',
  condition            tree_condition NOT NULL DEFAULT 'unknown',
  dbh_cm               real,
  height_m             real,
  canopy_radius_m      real,
  estimated_age_years  integer,
  notes                text,
  custom_fields        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tree_inspections_tree_idx ON tree_inspections (tree_id, inspected_on DESC);
CREATE INDEX tree_inspections_project_idx ON tree_inspections (project_id);

ALTER TABLE tree_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_inspections FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tree_inspections
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id() AND project_id = current_project_id());
