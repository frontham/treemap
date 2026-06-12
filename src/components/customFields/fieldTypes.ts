export const FIELD_TYPES = ['text', 'number', 'boolean', 'select', 'multiselect', 'date'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const hasOptions = (t: FieldType) => t === 'select' || t === 'multiselect';

/** Parse a comma/newline-separated options string into a clean list. */
export const parseOptions = (s: string) =>
  s
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);
