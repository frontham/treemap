-- Project scoping helper (mirrors current_org_id() from 0006).
CREATE OR REPLACE FUNCTION current_project_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_project_id', true), '')::uuid;
$$;

-- Keep org isolation on the read side (USING) so a missing project GUC never
-- locks out reads; additionally pin WRITES to the active project when one is
-- set. The "current_project_id() IS NULL OR" escape lets org-only contexts
-- (seed, data scripts, whole-org exports) keep writing as before.
DROP POLICY tenant_isolation ON trees;
CREATE POLICY tenant_isolation ON trees
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id()
    AND (current_project_id() IS NULL OR project_id = current_project_id()));

DROP POLICY tenant_isolation ON overlays;
CREATE POLICY tenant_isolation ON overlays
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id()
    AND (current_project_id() IS NULL OR project_id = current_project_id()));

DROP POLICY tenant_isolation ON custom_field_defs;
CREATE POLICY tenant_isolation ON custom_field_defs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id()
    AND (current_project_id() IS NULL OR project_id = current_project_id()));

DROP POLICY tenant_isolation ON tree_photos;
CREATE POLICY tenant_isolation ON tree_photos
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id()
    AND (current_project_id() IS NULL OR project_id = current_project_id()));

DROP POLICY tenant_isolation ON import_jobs;
CREATE POLICY tenant_isolation ON import_jobs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id()
    AND (current_project_id() IS NULL OR project_id = current_project_id()));

-- custom_field_defs uniqueness is now per-project (backfill ran in 0011).
DROP INDEX custom_field_defs_org_key_idx;
CREATE UNIQUE INDEX custom_field_defs_project_key_idx ON custom_field_defs (project_id, key);
