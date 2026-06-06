-- Projects: a sub-tenant grouping inside an organization. An org has many
-- projects; trees, overlays, custom fields and imports belong to one project.
CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX projects_org_slug_idx ON projects (org_id, slug);
CREATE INDEX projects_org_idx ON projects (org_id);

-- Per-project role override. A user's effective role on a project is this row's
-- role when present, otherwise their org membership role.
CREATE TABLE project_memberships (
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        role NOT NULL DEFAULT 'viewer',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX project_memberships_user_idx ON project_memberships (user_id);

-- RLS: projects are org-scoped (the org is the hard tenant boundary).
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON projects
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- RLS: project_memberships have no org_id; scope via the parent project's org
-- (mirrors the tree_revisions policy in 0006).
ALTER TABLE project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON project_memberships
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_memberships.project_id
      AND p.org_id = current_org_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_memberships.project_id
      AND p.org_id = current_org_id()
  ));
