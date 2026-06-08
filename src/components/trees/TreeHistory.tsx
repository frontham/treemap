'use client';

import { trpc } from '@/lib/trpc/client';
import type { RevisionView } from '@/server/trpc/routers/trees';

const FIELD_LABELS: Record<string, string> = {
  common_name: 'Common name',
  scientific_name: 'Scientific name',
  health: 'Health',
  condition: 'Condition',
  dbh_cm: 'DBH (cm)',
  height_m: 'Height (m)',
  canopy_radius_m: 'Canopy radius (m)',
  estimated_age_years: 'Age (yrs)',
  planted_date: 'Planted',
  notes: 'Notes',
  location_accuracy_m: 'GPS accuracy (m)',
  placed_via: 'Placed via',
};

// Bookkeeping columns that change on every save — not worth showing.
const HIDDEN = new Set([
  'id',
  'org_id',
  'project_id',
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
  'deleted_at',
]);

const OP_LABEL: Record<RevisionView['operation'], string> = {
  create: 'Created',
  update: 'Edited',
  delete: 'Deleted',
  restore: 'Restored',
};

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** The field-level changes for an 'update' revision. */
function Changes({ diff }: { diff: Record<string, unknown> }) {
  const entries = Object.entries(diff).filter(([k]) => !HIDDEN.has(k));
  if (entries.length === 0) {
    return <p className="text-xs text-muted">No field changes.</p>;
  }
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {entries.map(([key, change]) => {
        const label = FIELD_LABELS[key] ?? key;
        if (key === 'location') {
          return (
            <li key={key}>
              <span className="text-ink">Location</span> <span className="text-muted">moved</span>
            </li>
          );
        }
        if (key === 'custom_fields') {
          return (
            <li key={key}>
              <span className="text-ink">Custom fields</span>{' '}
              <span className="text-muted">updated</span>
            </li>
          );
        }
        const c = (change ?? {}) as { from?: unknown; to?: unknown };
        return (
          <li key={key}>
            <span className="text-ink">{label}: </span>
            <span className="text-muted line-through">{fmt(c.from)}</span>
            <span className="text-muted"> → </span>
            <span className="text-ink">{fmt(c.to)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** History tab: the change log for a tree, newest first. */
export function TreeHistory({ treeId }: { treeId: string }) {
  const { data: revisions = [], isLoading } = trpc.trees.history.useQuery({ id: treeId });

  if (isLoading) return <p className="text-sm text-muted">Loading history…</p>;
  if (revisions.length === 0) return <p className="text-sm text-muted">No history yet.</p>;

  return (
    <ol className="flex flex-col gap-3">
      {revisions.map((r) => (
        <li key={r.id} className="rounded-lg p-3 hairline bg-panel/40">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">
              {OP_LABEL[r.operation]}
            </span>
            <time className="text-xs text-muted">
              {new Date(r.changedAt).toLocaleString()}
            </time>
          </div>
          <p className="mb-2 truncate text-xs text-muted">
            {r.authorName || r.authorEmail || 'Unknown user'}
          </p>
          {r.operation === 'update' ? <Changes diff={r.diff} /> : null}
        </li>
      ))}
    </ol>
  );
}
