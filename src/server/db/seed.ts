import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, pool } from './client';
import { withOrgContext } from './tenantContext';
import { DEMO_ORG_ID, DEMO_USER_ID } from '@/server/auth/demo';

async function main() {
  console.log('seed: upserting demo org…');
  await db.execute(sql`
    INSERT INTO organizations (id, name, slug)
    VALUES (${DEMO_ORG_ID}::uuid, 'Demo Parks', 'demo')
    ON CONFLICT (id) DO UPDATE SET name = excluded.name
  `);

  console.log('seed: upserting demo user…');
  await db.execute(sql`
    INSERT INTO users (id, email, name, email_verified_at)
    VALUES (${DEMO_USER_ID}::uuid, 'demo@example.com', 'Demo User', now())
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('seed: upserting membership…');
  await withOrgContext(
    { orgId: DEMO_ORG_ID, userId: DEMO_USER_ID },
    async (tx) => {
      await tx.execute(sql`
        INSERT INTO memberships (org_id, user_id, role)
        VALUES (current_org_id(), current_user_id(), 'owner')
        ON CONFLICT (org_id, user_id) DO UPDATE SET role = excluded.role
      `);
    },
  );

  console.log('seed: upserting custom field defs…');
  await withOrgContext(
    { orgId: DEMO_ORG_ID, userId: DEMO_USER_ID },
    async (tx) => {
      await tx.execute(sql`
        INSERT INTO custom_field_defs (org_id, key, label, type, options, required, display_order)
        VALUES
          (current_org_id(), 'asset_tag', 'Asset tag', 'text', NULL, false, 10),
          (current_org_id(), 'last_inspected', 'Last inspected', 'date', NULL, false, 20),
          (current_org_id(), 'risk_rating', 'Risk rating', 'select',
            '["low","moderate","high","critical"]'::jsonb, false, 30)
        ON CONFLICT (org_id, key) DO UPDATE SET
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
