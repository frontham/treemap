/** "acme-parks" → "Acme Parks". */
export function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
