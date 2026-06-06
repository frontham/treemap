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

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${user.id}, true)`);

    const orgRes = await tx.execute(sql`
      SELECT o.id, o.slug, m.role
      FROM memberships m JOIN organizations o ON o.id = m.org_id
      WHERE m.user_id = current_user_id()
      ORDER BY (o.slug = ${orgSlug}) DESC NULLS LAST, m.joined_at ASC
      LIMIT 1
    `);
    const org = orgRes.rows[0] as OrgRow | undefined;
    if (!org) return { user, org: null, project: null };

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
      user,
      org: { id: org.id, slug: org.slug, role: org.role },
      project,
    };
  });
}
