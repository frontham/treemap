-- Phase E hardening: drop the "current_project_id() IS NULL OR" write escape
-- so every write to a project-scoped table MUST target the active project.
-- (Reads stay org-scoped via USING to avoid lock-out.) All app writers run
-- under project context; the seed sets project context for its field defs.
DROP POLICY tenant_isolation ON trees;
CREATE POLICY tenant_isolation ON trees
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id() AND project_id = current_project_id());

DROP POLICY tenant_isolation ON overlays;
CREATE POLICY tenant_isolation ON overlays
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id() AND project_id = current_project_id());

DROP POLICY tenant_isolation ON custom_field_defs;
CREATE POLICY tenant_isolation ON custom_field_defs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id() AND project_id = current_project_id());

DROP POLICY tenant_isolation ON tree_photos;
CREATE POLICY tenant_isolation ON tree_photos
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id() AND project_id = current_project_id());

DROP POLICY tenant_isolation ON import_jobs;
CREATE POLICY tenant_isolation ON import_jobs
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id() AND project_id = current_project_id());
