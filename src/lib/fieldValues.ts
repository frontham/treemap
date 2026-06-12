/** Render an arbitrary custom-field value as display text. */
export function formatFieldValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (v != null && typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Entries of a custom-fields object that actually hold a value. */
export function nonEmptyFieldEntries(fields: Record<string, unknown>): [string, unknown][] {
  return Object.entries(fields).filter(
    ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
  );
}
