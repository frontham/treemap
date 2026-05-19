import type { CustomFieldDefView } from '@/server/trpc/routers/customFields';

export type TreeFormValues = {
  commonName?: string;
  scientificName?: string;
  health?: string;
  condition?: string;
  dbhCm?: number;
  heightM?: number;
  canopyRadiusM?: number;
  estimatedAgeYears?: number;
  plantedDate?: string;
  notes?: string;
  customFields: Record<string, unknown>;
};

/**
 * Walks a TreeForm's FormData, separating standard fields from "cf.<key>"
 * custom fields. Each custom field is coerced to the type its def declares.
 */
export function parseTreeFormValues(
  fd: FormData,
  defs: CustomFieldDefView[],
): TreeFormValues {
  const text = (k: string) => {
    const v = fd.get(k);
    return typeof v === 'string' && v.length > 0 ? v : undefined;
  };
  const num = (k: string) => {
    const v = text(k);
    return v != null ? Number(v) : undefined;
  };

  return {
    commonName: text('commonName'),
    scientificName: text('scientificName'),
    health: text('health'),
    condition: text('condition'),
    dbhCm: num('dbhCm'),
    heightM: num('heightM'),
    canopyRadiusM: num('canopyRadiusM'),
    estimatedAgeYears: num('estimatedAgeYears'),
    plantedDate: text('plantedDate'),
    notes: text('notes'),
    customFields: parseCustomFields(fd, defs),
  };
}

function parseCustomFields(
  fd: FormData,
  defs: CustomFieldDefView[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    const name = `cf.${def.key}`;
    const value = coerce(def, fd, name);
    if (value !== undefined) out[def.key] = value;
  }
  return out;
}

function coerce(
  def: CustomFieldDefView,
  fd: FormData,
  name: string,
): unknown {
  if (def.type === 'multiselect') {
    const values = fd.getAll(name).filter((v): v is string => typeof v === 'string');
    return values.length > 0 ? values : undefined;
  }
  const raw = fd.get(name);
  if (typeof raw !== 'string' || raw.length === 0) {
    return def.type === 'boolean' ? false : undefined;
  }
  switch (def.type) {
    case 'number':
      return Number(raw);
    case 'boolean':
      return raw === 'true' || raw === 'on';
    default:
      return raw;
  }
}
