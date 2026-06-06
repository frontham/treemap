import { TRPCError } from '@trpc/server';
import { orgProcedure } from './orgProcedure';

/**
 * Requires an active project the user can access. Builds on orgProcedure (so
 * the tx already has app.current_project_id set) and narrows ctx.project to
 * non-null, exposing ctx.project.role for requireRole gates.
 */
export const projectProcedure = orgProcedure.use(({ ctx, next }) => {
  if (!ctx.project) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No project selected or accessible',
    });
  }
  return next({ ctx: { ...ctx, project: ctx.project } });
});
