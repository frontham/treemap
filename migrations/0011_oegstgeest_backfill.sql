-- Backfill existing demo-org data into projects. Idempotent, and a no-op on a
-- fresh database (guards on the demo org existing — the org/user are created by
-- the seed script). On the already-seeded DB this assigns the 968 imported
-- Oegstgeest trees + their 24 custom fields to an 'oegstgeest' project.
-- RLS is FORCE, so set the tenant GUCs before any write.
SELECT set_config('app.current_org_id',  '00000000-0000-0000-0000-000000000001', true);
SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000002', true);

-- 1. Two demo projects, fixed ids (mirror src/server/auth/demo.ts).
INSERT INTO projects (id, org_id, name, slug)
SELECT '00000000-0000-0000-0000-000000000010', id, 'Oegstgeest', 'oegstgeest'
FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, org_id, name, slug)
SELECT '00000000-0000-0000-0000-000000000011', id, 'Demo Trees', 'demo-trees'
FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (id) DO NOTHING;

-- 2. Trees: imported Oegstgeest rows -> oegstgeest, any others -> demo-trees.
UPDATE trees SET project_id = '00000000-0000-0000-0000-000000000010'
WHERE org_id = '00000000-0000-0000-0000-000000000001'
  AND project_id IS NULL
  AND custom_fields->>'bron' = 'GeoVisia OEGSTGEESTNEW.gvsx (import)';

UPDATE trees SET project_id = '00000000-0000-0000-0000-000000000011'
WHERE org_id = '00000000-0000-0000-0000-000000000001'
  AND project_id IS NULL;

-- 3. Custom field defs: the 3 generic seed defs -> demo-trees, all others
--    (the 24 imported Oegstgeest defs) -> oegstgeest.
UPDATE custom_field_defs SET project_id = '00000000-0000-0000-0000-000000000011'
WHERE org_id = '00000000-0000-0000-0000-000000000001'
  AND project_id IS NULL
  AND key IN ('asset_tag', 'last_inspected', 'risk_rating');

UPDATE custom_field_defs SET project_id = '00000000-0000-0000-0000-000000000010'
WHERE org_id = '00000000-0000-0000-0000-000000000001'
  AND project_id IS NULL;

-- 4. Overlays / import jobs -> demo-trees; photos inherit their tree's project.
UPDATE overlays SET project_id = '00000000-0000-0000-0000-000000000011'
WHERE org_id = '00000000-0000-0000-0000-000000000001' AND project_id IS NULL;

UPDATE import_jobs SET project_id = '00000000-0000-0000-0000-000000000011'
WHERE org_id = '00000000-0000-0000-0000-000000000001' AND project_id IS NULL;

UPDATE tree_photos ph SET project_id = t.project_id
FROM trees t WHERE t.id = ph.tree_id AND ph.project_id IS NULL;

-- 5. Demo user owns both projects.
INSERT INTO project_memberships (project_id, user_id, role)
SELECT p.id, '00000000-0000-0000-0000-000000000002', 'owner'
FROM projects p WHERE p.org_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (project_id, user_id) DO NOTHING;
