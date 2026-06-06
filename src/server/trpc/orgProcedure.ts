import { TRPCError } from '@trpc/server';
import { authedProcedure } from './authedProcedure';
import { withOrgContext, type Tx } from '@/server/db/tenantContext';

/**
 * Requires an authenticated user with membership in the active org. Opens a
 * transaction with RLS context set to that org + user (and the active project,
 * when one is resolved). The tx handle is exposed as ctx.tx; every tenant-scoped
 * resolver must use it instead of the raw db pool.
 */
export const orgProcedure = authedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.org) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No organization membership' });
  }
  const { user, org, project } = ctx;
  return withOrgContext(
    { orgId: org.id, userId: user.id, projectId: project?.id },
    (tx: Tx) => next({ ctx: { ...ctx, user, org, project, tx } }),
  );
});
