import { TRPCError } from '@trpc/server';
import { publicProcedure } from './init';

/** Requires a logged-in user. Narrows ctx.user to non-null. No tenant tx. */
export const authedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
