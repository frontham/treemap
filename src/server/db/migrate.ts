import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

async function ensureLedger(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename    text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function appliedFilenames(pool: Pool): Promise<Set<string>> {
  const res = await pool.query<{ filename: string }>('SELECT filename FROM _migrations');
  return new Set(res.rows.map((r) => r.filename));
}

function pendingFiles(applied: Set<string>): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .filter((f) => !applied.has(f));
}

async function applyOne(pool: Pool, file: string) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO _migrations(filename) VALUES ($1)', [file]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString: url });
  try {
    await ensureLedger(pool);
    const applied = await appliedFilenames(pool);
    const pending = pendingFiles(applied);

    if (pending.length === 0) {
      console.log('migrations: up to date');
      return;
    }

    for (const file of pending) {
      process.stdout.write(`→ ${file} ... `);
      await applyOne(pool, file);
      console.log('ok');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
