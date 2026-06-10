'use client';

import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { TreeView } from './TreeView';
import { TreePhotosStrip } from './TreePhotosStrip';
import { InspectionForm, type InspectionFormValues } from '@/components/forms/InspectionForm';
import type { InspectionView } from '@/server/trpc/routers/inspections';

type Props = { treeId: string; tree: TreeView; canEdit: boolean };

function formatVal(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (v != null && typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Collapsible list of the inspection's captured fields (the snapshot). */
function InspectionDetails({
  fields,
  labelFor,
  summary,
}: {
  fields: Record<string, unknown>;
  labelFor: (k: string) => string;
  summary: string;
}) {
  const entries = Object.entries(fields).filter(
    ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
  );
  if (entries.length === 0) return null;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer select-none text-xs text-accent">{summary}</summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        {entries.map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-muted">{labelFor(k)}</dt>
            <dd className="break-words text-ink">{formatVal(v)}</dd>
          </Fragment>
        ))}
      </dl>
    </details>
  );
}

/** Inspections tab: dated assessment log + create / edit / delete. */
export function TreeInspections({ treeId, tree, canEdit }: Props) {
  const t = useT();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<InspectionView | null>(null);
  const utils = trpc.useUtils();
  const today = new Date().toISOString().slice(0, 10);

  const { data: inspections = [], isLoading } = trpc.inspections.list.useQuery({ treeId });
  const { data: defs = [] } = trpc.customFields.list.useQuery();
  const labelFor = (key: string) => defs.find((d) => d.key === key)?.label ?? key;

  // Created/edited/deleted inspections can all change the tree's current values
  // (it mirrors the latest inspection) and its map colour, so invalidate both.
  const refresh = () => {
    utils.inspections.list.invalidate({ treeId });
    utils.trees.get.invalidate({ id: treeId });
    utils.trees.list.invalidate();
  };

  const create = trpc.inspections.create.useMutation({
    onSuccess: () => {
      refresh();
      setCreating(false);
    },
    onError: (e) => window.alert(`Couldn't save inspection: ${e.message}`),
  });

  const update = trpc.inspections.update.useMutation({
    onSuccess: () => {
      refresh();
      setEditing(null);
    },
    onError: (e) => window.alert(`Couldn't save inspection: ${e.message}`),
  });

  const remove = trpc.inspections.delete.useMutation({
    onSuccess: refresh,
    onError: (e) => window.alert(`Couldn't delete inspection: ${e.message}`),
  });

  if (editing) {
    return (
      <InspectionForm
        tree={tree}
        today={today}
        initial={editing}
        pending={update.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(values: InspectionFormValues) => update.mutate({ id: editing.id, ...values })}
      />
    );
  }

  if (creating) {
    return (
      <InspectionForm
        tree={tree}
        today={today}
        pending={create.isPending}
        onCancel={() => setCreating(false)}
        onSubmit={(values: InspectionFormValues) => create.mutate({ treeId, ...values })}
      />
    );
  }

  const onDelete = (id: string) => {
    if (window.confirm(t('insp.confirmDelete'))) remove.mutate({ id });
  };

  return (
    <div className="flex flex-col gap-3">
      {canEdit ? (
        <Button size="sm" variant="secondary" onClick={() => setCreating(true)} className="self-start">
          <PlusIcon size={14} />
          {t('insp.new')}
        </Button>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">{t('insp.loading')}</p>
      ) : inspections.length === 0 ? (
        <p className="text-sm text-muted">{t('insp.empty')}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {inspections.map((i) => (
            <li key={i.id} className="rounded-lg p-3 hairline bg-panel/40">
              <div className="mb-1 flex items-center justify-between gap-2">
                <time className="text-sm font-medium text-ink">
                  {new Date(i.inspectedOn).toLocaleDateString()}
                </time>
                <div className="flex min-w-0 items-center gap-1">
                  <span className="min-w-0 truncate text-xs text-muted">
                    {i.userName || i.inspectorName || i.userEmail || 'Unknown'}
                  </span>
                  {canEdit ? (
                    <>
                      <IconButton size="sm" label={t('common.edit')} onClick={() => setEditing(i)}>
                        <EditIcon size={14} />
                      </IconButton>
                      <IconButton
                        size="sm"
                        label={t('common.delete')}
                        onClick={() => onDelete(i.id)}
                        disabled={remove.isPending}
                        className="text-danger hover:bg-danger/10"
                      >
                        <TrashIcon size={14} />
                      </IconButton>
                    </>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted">
                {t('insp.health')}:{' '}
                <span className="text-ink">{t(`health.${i.health}`)}</span> ·{' '}
                {t('insp.condition')}:{' '}
                <span className="text-ink">{t(`condition.${i.condition}`)}</span>
              </p>
              {i.notes ? <p className="mt-1 text-xs text-ink">{i.notes}</p> : null}
              <InspectionDetails
                fields={i.customFields ?? {}}
                labelFor={labelFor}
                summary={t('insp.details')}
              />
              <div className="mt-2">
                <TreePhotosStrip
                  treeId={treeId}
                  inspectionId={i.id}
                  photos={i.photos}
                  canEdit={canEdit}
                  compact
                  onChanged={() => utils.inspections.list.invalidate({ treeId })}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
