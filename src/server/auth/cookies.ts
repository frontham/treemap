export const SESSION_COOKIE = 'treemap_session';
export const ORG_COOKIE = 'treemap_org';
export const PROJECT_COOKIE = 'treemap_project';

/** Parse a raw `Cookie:` header into a name→value map. */
export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

type CookieOpts = { maxAgeSeconds?: number; clear?: boolean };

/** Build a Set-Cookie string. httpOnly + SameSite=Lax; Secure in production. */
export function serializeCookie(name: string, value: string, opts: CookieOpts = {}): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  if (opts.clear) parts.push('Max-Age=0');
  else if (opts.maxAgeSeconds != null) parts.push(`Max-Age=${opts.maxAgeSeconds}`);
  return parts.join('; ');
}
