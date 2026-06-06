import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { pool } from './client';
import { withOrgContext } from './tenantContext';
import { DEMO_ORG_ID, DEMO_USER_ID } from '@/server/auth/demo';

const BRON = 'GeoVisia OEGSTGEESTNEW.gvsx (import)';

async function main() {
  await withOrgContext({ orgId: DEMO_ORG_ID, userId: DEMO_USER_ID }, async (tx) => {
    const cnt = await tx.execute(sql`
      SELECT count(*)::int AS n,
             min(ST_Y(location::geometry)) AS min_lat, max(ST_Y(location::geometry)) AS max_lat,
             min(ST_X(location::geometry)) AS min_lng, max(ST_X(location::geometry)) AS max_lng
      FROM trees WHERE org_id = current_org_id() AND custom_fields->>'bron' = ${BRON}`);
    console.log('trees:', cnt.rows[0]);

    const defs = await tx.execute(sql`
      SELECT count(*)::int AS n FROM custom_field_defs WHERE org_id = current_org_id() AND archived_at IS NULL`);
    console.log('custom field defs (org total):', defs.rows[0]);

    const perProject = await tx.execute(sql`
      SELECT p.slug, p.name,
             count(DISTINCT t.id)::int AS trees,
             count(DISTINCT d.id)::int AS fields
      FROM projects p
      LEFT JOIN trees t ON t.project_id = p.id AND t.deleted_at IS NULL
      LEFT JOIN custom_field_defs d ON d.project_id = p.id AND d.archived_at IS NULL
      WHERE p.org_id = current_org_id()
      GROUP BY p.id, p.slug, p.name ORDER BY p.slug`);
    console.log('per project (trees / fields):', perProject.rows);

    const unscoped = await tx.execute(sql`
      SELECT count(*)::int AS n FROM trees
      WHERE org_id = current_org_id() AND project_id IS NULL AND deleted_at IS NULL`);
    console.log('trees with NO project (should be 0):', unscoped.rows[0]);

    const health = await tx.execute(sql`
      SELECT health, count(*)::int AS n FROM trees
      WHERE org_id = current_org_id() AND custom_fields->>'bron' = ${BRON}
      GROUP BY health ORDER BY n DESC`);
    console.log('by health:', health.rows);

    const sample = await tx.execute(sql`
      SELECT scientific_name, health, condition, dbh_cm,
             custom_fields->>'adres' AS adres,
             custom_fields->'afwijkingen' AS afwijkingen,
             ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
      FROM trees WHERE org_id = current_org_id() AND custom_fields->>'bron' = ${BRON}
      ORDER BY custom_fields->>'orig_id' LIMIT 2`);
    console.log('sample rows:', JSON.stringify(sample.rows, null, 2));
  });
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
