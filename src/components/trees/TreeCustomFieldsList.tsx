'use client';

import { trpc } from '@/lib/trpc/client';
import type { CustomFieldDefView } from '@/server/trpc/routers/customFields';
import { cn } from '@/lib/cn';

type Props = { values: Record<string, unknown> };

/**
 * Read-only render of an org's custom-field values for a tree. Fetches the
 * defs itself so callers don't have to plumb them through.
 */
export function TreeCustomFieldsList({ values }: Props) {
  const { data: defs = [] } = trpc.customFields.list.useQuery();
  if (defs.length === 0) return null;
  return (
    <section className="space-y-2 border-t border-hairline pt-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
        Org fields
      </h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {defs.map((d) => (
          <Row key={d.id} def={d} value={values[d.key]} />
        ))}
      </dl>
    </section>
  );
}

function Row({ def, value }: { def: CustomFieldDefView; value: unknown }) {
  const mono = def.type === 'number' || def.type === 'date';
  return (
    <>
      <dt className="text-muted">{def.label}</dt>
      <dd className={cn('text-ink', mono && 'mono-num')}>{format(def, value)}</dd>
    </>
  );
}

function format(def: CustomFieldDefView, v: unknown): string {
  if (v == null || v === '') return '—';
  switch (def.type) {
    case 'boolean':
      return v ? 'Yes' : 'No';
    case 'multiselect':
      return Array.isArray(v) ? v.join(', ') : String(v);
    default:
      return String(v);
  }
}
