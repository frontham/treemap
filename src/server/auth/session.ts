import { randomBytes, createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';

const SESSION_DAYS = 30;

export type SessionUser = { id: string; email: string; name: string | null };

/** Sessions store only a sha256 of the token, never the token itself. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a session row and returns the raw token to set as a cookie. The
 * `sessions` table has no RLS, so this runs on the bare pool (no tenant ctx).
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await db.execute(sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${hashToken(token)}, ${expiresAt})
  `);
  return token;
}

export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const res = await db.execute(sql`
    SELECT u.id, u.email, u.name
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${hashToken(token)} AND s.expires_at > now()
    LIMIT 1
  `);
  return (res.rows[0] as SessionUser | undefined) ?? null;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.execute(sql`DELETE FROM sessions WHERE token = ${hashToken(token)}`);
}

export const SESSION_TTL_SECONDS = SESSION_DAYS * 86_400;
