import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, pool } from './client';
import { withOrgContext } from './tenantContext';
import {
  DEMO_ORG_ID,
  DEMO_USER_ID,
  VIEWER_USER_ID,
  OEGSTGEEST_PROJECT_ID,
  DEMO_TREES_PROJECT_ID,
} from '@/server/auth/demo';
import { hashPassword } from '@/server/auth/password';

async function main() {
  console.log('seed: upserting demo org…');
  await db.execute(sql`
    INSERT INTO organizations (id, name, slug)
    VALUES (${DEMO_ORG_ID}::uuid, 'Demo Parks', 'demo')
    ON CONFLICT (id) DO UPDATE SET name = excluded.name
  `);

  console.log('seed: upserting users (with passwords)…');
  const demoHash = await hashPassword('demo1234');
  const viewerHash = await hashPassword('viewer1234');
  await db.execute(sql`
    INSERT INTO users (id, email, name, password_hash, email_verified_at)
    VALUES
      (${DEMO_USER_ID}::uuid, 'demo@example.com', 'Demo User', ${demoHash}, now()),
      (${VIEWER_USER_ID}::uuid, 'viewer@example.com', 'Vera Viewer', ${viewerHash}, now())
    ON CONFLICT (id) DO UPDATE SET
      password_hash = excluded.password_hash,
      name = excluded.name,
      email = excluded.email
  `);

  console.log('seed: upserting org memberships…');
  await withOrgContext(
    { orgId: DEMO_ORG_ID, userId: DEMO_USER_ID },
    async (tx) => {
      await tx.execute(sql`
        INSERT INTO memberships (org_id, user_id, role)
        VALUES
          (current_org_id(), ${DEMO_USER_ID}::uuid, 'owner'),
          (current_org_id(), ${VIEWER_USER_ID}::uuid, 'viewer')
        ON CONFLICT (org_id, user_id) DO UPDATE SET role = excluded.role
      `);
    },
  );

  console.log('seed: upserting demo projects + memberships…');
  await withOrgContext(
    { orgId: DEMO_ORG_ID, userId: DEMO_USER_ID },
    async (tx) => {
      await tx.execute(sql`
        INSERT INTO projects (id, org_id, name, slug) VALUES
          (${OEGSTGEEST_PROJECT_ID}::uuid, current_org_id(), 'Oegstgeest', 'oegstgeest'),
          (${DEMO_TREES_PROJECT_ID}::uuid, current_org_id(), 'Demo Trees', 'demo-trees')
        ON CONFLICT (id) DO UPDATE SET name = excluded.name, slug = excluded.slug
      `);
      await tx.execute(sql`
        INSERT INTO project_memberships (project_id, user_id, role) VALUES
          (${OEGSTGEEST_PROJECT_ID}::uuid, ${DEMO_USER_ID}::uuid, 'owner'),
          (${DEMO_TREES_PROJECT_ID}::uuid, ${DEMO_USER_ID}::uuid, 'owner'),
          (${OEGSTGEEST_PROJECT_ID}::uuid, ${VIEWER_USER_ID}::uuid, 'editor'),
          (${DEMO_TREES_PROJECT_ID}::uuid, ${VIEWER_USER_ID}::uuid, 'viewer')
        ON CONFLICT (project_id, user_id) DO UPDATE SET role = excluded.role
      `);
    },
  );

  console.log('seed: upserting custom field defs (Demo Trees project)…');
  await withOrgContext(
    { orgId: DEMO_ORG_ID, userId: DEMO_USER_ID, projectId: DEMO_TREES_PROJECT_ID },
    async (tx) => {
      await tx.execute(sql`
        INSERT INTO custom_field_defs (org_id, project_id, key, label, type, options, required, display_order)
        VALUES
          (current_org_id(), ${DEMO_TREES_PROJECT_ID}::uuid, 'asset_tag', 'Asset tag', 'text', NULL, false, 10),
          (current_org_id(), ${DEMO_TREES_PROJECT_ID}::uuid, 'last_inspected', 'Last inspected', 'date', NULL, false, 20),
          (current_org_id(), ${DEMO_TREES_PROJECT_ID}::uuid, 'risk_rating', 'Risk rating', 'select',
            '["low","moderate","high","critical"]'::jsonb, false, 30)
        ON CONFLICT (project_id, key) DO UPDATE SET
          label = excluded.label,
          type = excluded.type,
          options = excluded.options,
          required = excluded.required,
          display_order = excluded.display_order
      `);
    },
  );

  console.log('seed: ok');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
