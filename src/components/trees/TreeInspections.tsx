'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@/components/icons';
import { trpc } from '@/lib/trpc/client';
import type { TreeView } from './TreeView';
import { InspectionForm, type InspectionFormValues } from '@/components/forms/InspectionForm';

const HEALTH_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  fair: 'Fair',
  poor: 'Poor',
  dead: 'Dead',
  unknown: 'Unknown',
};
const CONDITION_LABEL: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  critical: 'Critical',
  unknown: 'Unknown',
};

type Props = { treeId: string; tree: TreeView; canEdit: boolean };

/** Inspections tab: dated assessment log + a "New inspection" form. */
export function TreeInspections({ treeId, tree, canEdit }: Props) {
  const [mode, setMode] = useState<'list' | 'new'>('list');
  const utils = trpc.useUtils();
  const today = new Date().toISOString().slice(0, 10);

  const { data: inspections = [], isLoading } = trpc.inspections.list.useQuery({ treeId });

  const create = trpc.inspections.create.useMutation({
    onSuccess: () => {
      utils.inspections.list.invalidate({ treeId });
      utils.trees.get.invalidate({ id: treeId }); // tree's current values changed
      utils.trees.list.invalidate(); // health can affect the map
      setMode('list');
    },
    onError: (e) => window.alert(`Couldn't save inspection: ${e.message}`),
  });

  if (mode === 'new') {
    return (
      <InspectionForm
        tree={tree}
        today={today}
        pending={create.isPending}
        onCancel={() => setMode('list')}
        onSubmit={(values: InspectionFormValues) => create.mutate({ treeId, ...values })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canEdit ? (
        <Button size="sm" variant="secondary" onClick={() => setMode('new')} className="self-start">
          <PlusIcon size={14} />
          New inspection
        </Button>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">Loading inspections…</p>
      ) : inspections.length === 0 ? (
        <p className="text-sm text-muted">No inspections yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {inspections.map((i) => (
            <li key={i.id} className="rounded-lg p-3 hairline bg-panel/40">
              <div className="mb-1 flex items-center justify-between gap-2">
                <time className="text-sm font-medium text-ink">
                  {new Date(i.inspectedOn).toLocaleDateString()}
                </time>
                <span className="truncate text-xs text-muted">
                  {i.inspectorName || i.inspectorEmail || 'Unknown'}
                </span>
              </div>
              <p className="text-xs text-muted">
                Health: <span className="text-ink">{HEALTH_LABEL[i.health] ?? i.health}</span> ·
                Condition:{' '}
                <span className="text-ink">{CONDITION_LABEL[i.condition] ?? i.condition}</span>
              </p>
              {i.notes ? <p className="mt-1 text-xs text-ink">{i.notes}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
