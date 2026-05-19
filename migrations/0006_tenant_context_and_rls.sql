-- Session helpers used by RLS policies and the audit trigger.
CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- Memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON memberships
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invitations
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Species: org_id IS NULL rows are the shared global catalog (readable by everyone in tenant context)
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE species FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON species
  USING (org_id IS NULL OR org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Custom field definitions
ALTER TABLE custom_field_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_defs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON custom_field_defs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Trees
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE trees FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON trees
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Tree photos
ALTER TABLE tree_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_photos FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tree_photos
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Overlays
ALTER TABLE overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlays FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON overlays
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Import jobs
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON import_jobs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Tree revisions: no org_id column; scope via parent tree.
ALTER TABLE tree_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_revisions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tree_revisions
  USING (EXISTS (
    SELECT 1 FROM trees t
    WHERE t.id = tree_revisions.tree_id
      AND t.org_id = current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM trees t
    WHERE t.id = tree_revisions.tree_id
      AND t.org_id = current_org_id()
  ));
