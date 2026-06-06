import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../init';
import { db } from '@/server/db/client';
import { verifyPassword } from '@/server/auth/password';
import { createSession, deleteSession, SESSION_TTL_SECONDS } from '@/server/auth/session';
import { SESSION_COOKIE, serializeCookie } from '@/server/auth/cookies';

export const authRouter = router({
  /** Current session: user + active org + active project (null when logged out). */
  me: publicProcedure.query(({ ctx }) => ({
    user: ctx.user,
    org: ctx.org,
    project: ctx.project,
  })),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const res = await db.execute(sql`
        SELECT id, password_hash FROM users
        WHERE email = ${input.email.toLowerCase()} LIMIT 1
      `);
      const row = res.rows[0] as { id: string; password_hash: string | null } | undefined;
      const ok = row ? await verifyPassword(input.password, row.password_hash) : false;
      if (!row || !ok) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }
      const token = await createSession(row.id);
      ctx.resHeaders.append(
        'Set-Cookie',
        serializeCookie(SESSION_COOKIE, token, { maxAgeSeconds: SESSION_TTL_SECONDS }),
      );
      return { ok: true };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await deleteSession(ctx.sessionToken);
    ctx.resHeaders.append('Set-Cookie', serializeCookie(SESSION_COOKIE, '', { clear: true }));
    return { ok: true };
  }),
});
