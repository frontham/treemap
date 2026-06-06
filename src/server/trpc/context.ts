import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import {
  resolveRequestContext,
  type ResolvedContext,
  type Role,
} from '@/server/auth/resolveContext';
import { parseCookies, SESSION_COOKIE } from '@/server/auth/cookies';

export type { Role };

export type Context = ResolvedContext & {
  /** Raw session token from the cookie, used by auth.logout. */
  sessionToken?: string;
  /** Response headers — login/logout append Set-Cookie here. */
  resHeaders: Headers;
};

/**
 * Resolves the acting user + active org + active project from the request's
 * session cookie. Replaces the previous hardcoded demo identity (Phase B).
 */
export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  const cookieHeader = opts.req.headers.get('cookie');
  const resolved = await resolveRequestContext(cookieHeader);
  return {
    ...resolved,
    sessionToken: parseCookies(cookieHeader)[SESSION_COOKIE],
    resHeaders: opts.resHeaders,
  };
}
