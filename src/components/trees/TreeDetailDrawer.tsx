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
import { ChevronDownIcon } from '@/components/icons';
import { TreeDetailHeader } from './TreeDetailHeader';
import { TreeAttributesGrid } from './TreeAttributesGrid';
import { TreePhotosStrip } from './TreePhotosStrip';
import { TreeDetailActions } from './TreeDetailActions';
import { TreeHistory } from './TreeHistory';
import { TreeInspections } from './TreeInspections';
import { TreeDetailSkeleton } from './TreeDetailSkeleton';
import { useRole } from '@/components/auth/useRole';

/**
 * Drawer for the selected tree. One scrolling view (no tabs):
 *   - Tree identity (facts + general photos) — editable via the Edit button.
 *   - Assessments — the dated timeline; the newest is the tree's current state.
 *   - Change log — the per-field audit trail, folded away.
 * 'edit' swaps the whole panel for the identity-only TreeForm.
 */
export function TreeDetailDrawer() {
  const { selectedId, select } = useSelection();
  const move = useTreeMove();
  const [editing, setEditing] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const { can } = useRole();
  const t = useT();
  const canEdit = can('editor');
  const isMoving = !!selectedId && move.movingId === selectedId;

  // Drop out of edit / collapse the log when a different tree opens.
  useEffect(() => {
    setEditing(false);
    setShowLog(false);
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

  function close() {
    select(null);
    setEditing(false);
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
      ) : (
        <div className="flex h-full flex-col p-5">
          <TreeDetailHeader
            commonName={tree.commonName}
            scientificName={tree.scientificName}
            onClose={close}
          />

          <div className="mt-3 flex-1 overflow-y-auto">
            {/* Tree identity — the tree's own facts (editable via Edit). */}
            <div className="flex flex-col gap-5">
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
            </div>

            {/* Assessments — the dated timeline; newest card = current state. */}
            <section className="mt-6 border-t border-hairline pt-4">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                {t('assess.title')}
              </h3>
              <TreeInspections treeId={selectedId ?? ''} tree={tree} canEdit={canEdit} />
            </section>

            {/* Change log — the per-field audit trail, loaded only when opened. */}
            <section className="mt-6 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setShowLog((s) => !s)}
                className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wider text-muted hover:text-ink"
              >
                {t('assess.changelog')}
                <ChevronDownIcon
                  size={16}
                  className={cn('transition-transform', showLog && 'rotate-180')}
                />
              </button>
              {showLog ? (
                <div className="mt-3">
                  <TreeHistory treeId={selectedId ?? ''} />
                </div>
              ) : null}
            </section>
          </div>

          {canEdit ? (
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
