import { sql } from 'drizzle-orm';
import { db } from './client';

export type OrgContext = { orgId: string; userId: string };

/** The Drizzle transaction handle passed to {@link withOrgContext}'s callback. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs `fn` inside a transaction whose session has app.current_org_id and
 * app.current_user_id set. RLS policies and the trees audit trigger read those
 * settings, so every tenant-scoped query MUST go through this helper.
 */
export async function withOrgContext<T>(
  ctx: OrgContext,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`);
    return fn(tx);
  });
}
