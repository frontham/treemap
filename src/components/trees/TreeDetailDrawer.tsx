'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useSelection } from '@/components/map/SelectionContext';
import { useTreeMove } from '@/components/map/TreeMoveContext';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';
import { TreeForm } from '@/components/forms/TreeForm';
import type { TreeFormValues } from '@/components/forms/parseTreeFormData';
import { InspectionForm, type InspectionFormValues } from '@/components/forms/InspectionForm';
import { PlusIcon } from '@/components/icons';
import { TreeDetailHeader } from './TreeDetailHeader';
import { TreeAttributesGrid } from './TreeAttributesGrid';
import { TreeCustomFieldsList } from './TreeCustomFieldsList';
import { TreePhotosStrip } from './TreePhotosStrip';
import { TreeDetailActions } from './TreeDetailActions';
import { TreeHistory } from './TreeHistory';
import { TreeInspections } from './TreeInspections';
import { TreeDetailSkeleton } from './TreeDetailSkeleton';
import { useRole } from '@/components/auth/useRole';

/**
 * Drawer that shows the selected tree. Two internal modes:
 *   - 'view'  — read-only attributes + Edit / Delete actions
 *   - 'edit'  — TreeForm prefilled with current values, saves via update mutation
 * Switching to edit happens locally; closing the drawer resets to view.
 */
export function TreeDetailDrawer() {
  const { selectedId, select } = useSelection();
  const move = useTreeMove();
  const [editing, setEditing] = useState(false);
  // 'assessing' = logging a new dated inspection from the Details "Update
  // assessment" button (the only way to change condition/measurements/notes).
  const [assessing, setAssessing] = useState(false);
  const { can } = useRole();
  const t = useT();
  const canEdit = can('editor');
  const isMoving = !!selectedId && move.movingId === selectedId;
  const [tab, setTab] = useState<'details' | 'history' | 'inspections'>('details');
  const today = new Date().toISOString().slice(0, 10);

  // Reset to the Details tab (and out of any sub-form) when a different tree opens.
  useEffect(() => {
    setTab('details');
    setEditing(false);
    setAssessing(false);
  }, [selectedId]);

  const utils = trpc.useUtils();

  const { data: tree, isLoading } = trpc.trees.get.useQuery(
    { id: selectedId ?? '' },
    { enabled: !!selectedId },
  );

  const updateTree = trpc.trees.update.useMutation({
    onSuccess: () => {
      utils.trees.list.invalidate();
      if (selectedId) utils.trees.get.invalidate({ id: selectedId });
      setEditing(false);
    },
  });

  const deleteTree = trpc.trees.delete.useMutation({
    onSuccess: () => {
      utils.trees.list.invalidate();
      close();
    },
  });

  // Logging an assessment is creating an inspection; it re-syncs the tree's
  // current values + map colour, so refresh the tree, the list and inspections.
  const createInspection = trpc.inspections.create.useMutation({
    onSuccess: () => {
      if (selectedId) {
        utils.trees.get.invalidate({ id: selectedId });
        utils.inspections.list.invalidate({ treeId: selectedId });
      }
      utils.trees.list.invalidate();
      setAssessing(false);
    },
    onError: (e) => window.alert(`Couldn't save assessment: ${e.message}`),
  });

  function close() {
    select(null);
    setEditing(false);
    setAssessing(false);
    move.cancel();
  }

  function startMove() {
    if (selectedId && tree) move.begin(selectedId, tree.location);
  }

  async function handleSave(values: TreeFormValues) {
    if (!selectedId) return;
    await updateTree.mutateAsync({ id: selectedId, ...values });
  }

  function handleDelete() {
    if (!selectedId || !tree) return;
    const ok = window.confirm(`Delete "${tree.commonName}"? This can be restored from history.`);
    if (ok) deleteTree.mutate({ id: selectedId });
  }

  return (
    <Drawer open={!!selectedId && !isMoving} onClose={close}>
      {isLoading || !tree ? (
        <TreeDetailSkeleton />
      ) : editing ? (
        <TreeForm
          mode="edit"
          location={tree.location}
          initial={tree}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
          footerLeft={
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-danger hover:bg-danger/10"
            >
              Delete
            </Button>
          }
        />
      ) : assessing ? (
        <div className="flex h-full flex-col p-5">
          <TreeDetailHeader
            commonName={tree.commonName}
            scientificName={tree.scientificName}
            onClose={() => setAssessing(false)}
          />
          <h3 className="mb-3 mt-3 text-sm font-medium text-ink">{t('assess.new')}</h3>
          <div className="flex-1 overflow-y-auto">
            <InspectionForm
              tree={tree}
              today={today}
              pending={createInspection.isPending}
              onCancel={() => setAssessing(false)}
              onSubmit={(values: InspectionFormValues) => {
                if (selectedId) createInspection.mutate({ treeId: selectedId, ...values });
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col p-5">
          <TreeDetailHeader
            commonName={tree.commonName}
            scientificName={tree.scientificName}
            onClose={close}
          />

          <div className="mb-4 mt-3 grid grid-cols-3 gap-1 rounded-lg bg-paper p-0.5 hairline">
            {(['details', 'history', 'inspections'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'rounded px-2 py-1 text-xs transition-colors',
                  tab === key ? 'bg-panel font-medium text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {t(`tree.tab.${key}`)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === 'details' ? (
              <div className="flex flex-col gap-5">
                {/* TREE — the tree's own identity (editable via the Edit button). */}
                <TreeAttributesGrid tree={tree} variant="identity" />
                <TreePhotosStrip
                  treeId={selectedId ?? ''}
                  photos={tree.photos}
                  canEdit={canEdit}
                  title={t('photos.treeTitle')}
                  onChanged={() => {
                    if (selectedId) utils.trees.get.invalidate({ id: selectedId });
                  }}
                />

                {/* CURRENT ASSESSMENT — read-only mirror of the latest inspection;
                    changed by logging an assessment, not by editing here. */}
                <section className="space-y-3 border-t border-hairline pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                      {t('assess.current')}
                      {' · '}
                      <span className="text-ink">
                        {tree.latestInspection
                          ? new Date(tree.latestInspection.inspectedOn).toLocaleDateString()
                          : t('assess.notInspected')}
                      </span>
                    </h3>
                    {canEdit ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setAssessing(true)}
                        className="shrink-0"
                      >
                        <PlusIcon size={14} />
                        {t('assess.update')}
                      </Button>
                    ) : null}
                  </div>
                  <TreeAttributesGrid tree={tree} variant="assessment" />
                  <TreeCustomFieldsList values={tree.customFields} />
                  {tree.latestInspection && tree.latestInspection.photos.length > 0 ? (
                    <TreePhotosStrip
                      treeId={selectedId ?? ''}
                      photos={tree.latestInspection.photos}
                      canEdit={false}
                      compact
                      title={t('photos.evidence')}
                      onChanged={() => {}}
                    />
                  ) : null}
                </section>
              </div>
            ) : tab === 'history' ? (
              <TreeHistory treeId={selectedId ?? ''} />
            ) : (
              <TreeInspections treeId={selectedId ?? ''} tree={tree} canEdit={canEdit} />
            )}
          </div>

          {canEdit && tab === 'details' ? (
            <div className="pt-4">
              <TreeDetailActions
                onEdit={() => setEditing(true)}
                onMove={startMove}
                onDelete={handleDelete}
              />
            </div>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
