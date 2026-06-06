import { TRPCError } from '@trpc/server';
import { middleware } from './init';
import type { Role } from './context';

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

/**
 * Gate by effective project role (falls back to org role for org-level
 * procedures). Use after projectProcedure, e.g. `projectProcedure.use(requireRole('editor'))`.
 */
export function requireRole(min: Role) {
  return middleware(({ ctx, next }) => {
    const role = ctx.project?.role ?? ctx.org?.role;
    if (!role || RANK[role] < RANK[min]) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Requires ${min} role` });
    }
    return next();
  });
}

/** Gate by org membership role. Use after orgProcedure. */
export function requireOrgRole(min: Role) {
  return middleware(({ ctx, next }) => {
    if (!ctx.org || RANK[ctx.org.role] < RANK[min]) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Requires org ${min} role` });
    }
    return next();
  });
}
