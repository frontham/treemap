import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ORG_COOKIE, PROJECT_COOKIE } from '@/server/auth/cookies';

/**
 * Gates /orgs/** behind a session cookie (cheap presence check; real
 * verification + role checks happen in the tRPC layer), and mirrors the active
 * org/project SLUGS from the URL into cookies so tRPC calls, the offline queue,
 * and the export routes all resolve the same project.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!req.cookies.get(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  const m = pathname.match(/^\/orgs\/([^/]+)(?:\/projects\/([^/]+))?/);
  if (m) {
    const opts = { path: '/', httpOnly: true, sameSite: 'lax' as const };
    const orgSlug = m[1];
    const projectSlug = m[2];
    if (orgSlug) res.cookies.set(ORG_COOKIE, decodeURIComponent(orgSlug), opts);
    if (projectSlug) res.cookies.set(PROJECT_COOKIE, decodeURIComponent(projectSlug), opts);
  }
  return res;
}

export const config = { matcher: ['/orgs/:path*'] };
