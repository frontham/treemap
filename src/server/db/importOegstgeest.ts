import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { pool } from './client';
import { withOrgContext } from './tenantContext';
import { insertTreeRow } from '@/server/imports/insertTreeRow';
import { DEMO_ORG_ID, DEMO_USER_ID, OEGSTGEEST_PROJECT_ID } from '@/server/auth/demo';

/**
 * One-off importer for the Oegstgeest GeoVisia export (OEGSTGEESTNEW.gvsx +
 * BOMEN shapefile). Converted to WGS84 and mapped to TreeMap fields by the
 * Python pipeline in /data. Re-runnable: trees are keyed by the `bron` marker
 * so a second run replaces rather than duplicates them.
 *
 *   npx tsx src/server/db/importOegstgeest.ts
 */
const BRON = 'GeoVisia OEGSTGEESTNEW.gvsx (import)';
const DATA = path.join(process.cwd(), 'data');

type FieldDef = {
  key: string;
  label: string;
  type: string;
  options: string[] | null;
  displayOrder: number;
};
type Tree = {
  lng: number;
  lat: number;
  scientificName: string | null;
  health: string;
  condition: string;
  dbhCm: number | null;
  plantedDate: string | null;
  notes: string | null;
  customFields: Record<string, unknown>;
};

const fields: FieldDef[] = JSON.parse(
  readFileSync(path.join(DATA, 'oegstgeest_fields.json'), 'utf8'),
);
const trees: Tree[] = JSON.parse(
  readFileSync(path.join(DATA, 'bomen_oegstgeest.trees.json'), 'utf8'),
);

async function main() {
  console.log(`import: ${fields.length} field defs, ${trees.length} trees`);
  await withOrgContext(
    { orgId: DEMO_ORG_ID, userId: DEMO_USER_ID, projectId: OEGSTGEEST_PROJECT_ID },
    async (tx) => {
    console.log('  upserting custom field defs…');
    for (const f of fields) {
      await tx.execute(sql`
        INSERT INTO custom_field_defs (org_id, project_id, key, label, type, options, required, display_order)
        VALUES (current_org_id(), current_project_id(), ${f.key}, ${f.label}, ${f.type}::custom_field_type,
          ${f.options ? JSON.stringify(f.options) : null}::jsonb, false, ${f.displayOrder})
        ON CONFLICT (project_id, key) DO UPDATE SET
          label = excluded.label, type = excluded.type,
          options = excluded.options, display_order = excluded.display_order
      `);
    }

    console.log('  removing any prior import of this source…');
    const del = await tx.execute(sql`
      DELETE FROM trees
      WHERE org_id = current_org_id() AND custom_fields->>'bron' = ${BRON}
    `);
    console.log(`    deleted ${del.rowCount ?? 0} existing rows`);

    console.log('  inserting trees…');
    let n = 0;
    for (const t of trees) {
      await insertTreeRow(tx, {
        lng: t.lng,
        lat: t.lat,
        scientificName: t.scientificName,
        health: t.health,
        condition: t.condition,
        dbhCm: t.dbhCm,
        plantedDate: t.plantedDate,
        notes: t.notes,
        customFields: t.customFields,
      });
      if (++n % 100 === 0) console.log(`    ${n}/${trees.length}`);
    }
    console.log(`  inserted ${n} trees`);
  });
  await pool.end();
  console.log('import: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
