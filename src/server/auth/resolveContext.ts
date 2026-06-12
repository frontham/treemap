import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { getSessionUser, type SessionUser } from './session';
import { parseCookies, SESSION_COOKIE, ORG_COOKIE, PROJECT_COOKIE } from './cookies';

export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

export type ResolvedContext = {
  user: SessionUser | null;
  org: { id: string; slug: string; role: Role } | null;
  project: { id: string; slug: string; role: Role } | null;
};

type OrgRow = { id: string; slug: string; role: Role };
type ProjRow = { id: string; slug: string; role: Role };

type Membership = Pick<ResolvedContext, 'org' | 'project'>;

/**
 * Short-lived per-instance cache of the org/project membership resolution.
 * The session check itself is NOT cached (logout stays immediate); only the
 * membership/role lookup is, so a role change or project rename can take up
 * to TTL to propagate — acceptable, and on serverless each warm instance has
 * its own cache anyway. Saves a transaction + three queries per request.
 */
const membershipCache = new Map<string, { value: Membership; expires: number }>();
const MEMBERSHIP_TTL_MS = 60_000;
const MEMBERSHIP_CACHE_MAX = 1_000;

function cacheGet(key: string): Membership | null {
  const entry = membershipCache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    membershipCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key: string, value: Membership) {
  if (membershipCache.size >= MEMBERSHIP_CACHE_MAX) {
    // Drop the oldest entry (insertion order) to stay bounded.
    const oldest = membershipCache.keys().next().value;
    if (oldest !== undefined) membershipCache.delete(oldest);
  }
  membershipCache.set(key, { value, expires: Date.now() + MEMBERSHIP_TTL_MS });
}

/**
 * Resolves the acting user + active org + active project (with effective role)
 * from the request cookies. The active org/project are chosen by the SLUG
 * cookies that middleware sets from the URL path; the user's effective project
 * role is their project_membership role if present, else their org membership
 * role. Without valid cookies it falls back to the user's first org and first
 * accessible project. Returns an unauthenticated context when no session.
 */
export async function resolveRequestContext(
  cookieHeader: string | null | undefined,
): Promise<ResolvedContext> {
  const cookies = parseCookies(cookieHeader);
  const user = await getSessionUser(cookies[SESSION_COOKIE]);
  if (!user) return { user: null, org: null, project: null };

  const orgSlug = cookies[ORG_COOKIE] ?? null;
  const projectSlug = cookies[PROJECT_COOKIE] ?? null;

  const cacheKey = `${user.id}|${orgSlug ?? ''}|${projectSlug ?? ''}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { user, ...cached };

  const membership = await resolveMembership(user.id, orgSlug, projectSlug);
  cacheSet(cacheKey, membership);
  return { user, ...membership };
}

/** The uncached org/project lookup (runs under RLS, hence the GUC transaction). */
async function resolveMembership(
  userId: string,
  orgSlug: string | null,
  projectSlug: string | null,
): Promise<Membership> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

    const orgRes = await tx.execute(sql`
      SELECT o.id, o.slug, m.role
      FROM memberships m JOIN organizations o ON o.id = m.org_id
      WHERE m.user_id = current_user_id()
      ORDER BY (o.slug = ${orgSlug}) DESC NULLS LAST, m.joined_at ASC
      LIMIT 1
    `);
    const org = orgRes.rows[0] as OrgRow | undefined;
    if (!org) return { org: null, project: null };

    await tx.execute(sql`SELECT set_config('app.current_org_id', ${org.id}, true)`);

    const projRes = await tx.execute(sql`
      SELECT p.id, p.slug, COALESCE(pm.role, ${org.role}::role) AS role
      FROM projects p
      LEFT JOIN project_memberships pm
        ON pm.project_id = p.id AND pm.user_id = current_user_id()
      WHERE p.org_id = current_org_id()
        AND (pm.user_id IS NOT NULL OR ${org.role} IN ('owner', 'admin'))
      ORDER BY (p.slug = ${projectSlug}) DESC NULLS LAST, p.slug ASC
      LIMIT 1
    `);
    const project = (projRes.rows[0] as ProjRow | undefined) ?? null;

    return {
      org: { id: org.id, slug: org.slug, role: org.role },
      project,
    };
  });
}
