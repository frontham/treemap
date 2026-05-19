import { publicProcedure } from './init';
import { withOrgContext, type Tx } from '@/server/db/tenantContext';

/**
 * Procedure that opens a transaction with RLS context set to the request's
 * org + user. The transaction handle is exposed as ctx.tx; every tenant-scoped
 * resolver must use it instead of the raw db pool.
 */
export const orgProcedure = publicProcedure.use(async ({ ctx, next }) => {
  return withOrgContext({ orgId: ctx.orgId, userId: ctx.userId }, (tx: Tx) =>
    next({ ctx: { ...ctx, tx } }),
  );
});
