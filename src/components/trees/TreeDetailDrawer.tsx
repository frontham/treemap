'use client';

import { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useSelection } from '@/components/map/SelectionContext';
import { useTreeMove } from '@/components/map/TreeMoveContext';
import { trpc } from '@/lib/trpc/client';
import { TreeForm } from '@/components/forms/TreeForm';
import type { TreeFormValues } from '@/components/forms/parseTreeFormData';
import { TreeDetailHeader } from './TreeDetailHeader';
import { TreeAttributesGrid } from './TreeAttributesGrid';
import { TreeCustomFieldsList } from './TreeCustomFieldsList';
import { TreePhotosStrip } from './TreePhotosStrip';
import { TreeDetailActions } from './TreeDetailActions';
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
  const { can } = useRole();
  const canEdit = can('editor');
  const isMoving = !!selectedId && move.movingId === selectedId;

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

  const moveTree = trpc.trees.move.useMutation({
    onSuccess: () => {
      utils.trees.list.invalidate();
      if (selectedId) utils.trees.get.invalidate({ id: selectedId });
      move.cancel();
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

  function saveMove() {
    if (selectedId && move.draft) {
      moveTree.mutate({ id: selectedId, lng: move.draft.lng, lat: move.draft.lat });
    }
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
    <Drawer open={!!selectedId} onClose={close}>
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
      ) : isMoving ? (
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
          <TreeDetailHeader
            commonName={tree.commonName}
            scientificName={tree.scientificName}
            onClose={close}
          />
          <div className="rounded-lg p-3 hairline bg-panel/60">
            <p className="mb-3 text-xs text-muted">
              Drag the blue marker on the map, or type coordinates below. Nothing is saved
              until you press Save.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">Latitude</span>
                <input
                  type="number"
                  step={0.000001}
                  value={move.draft?.lat ?? tree.location.lat}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value);
                    if (!Number.isNaN(lat)) {
                      move.setDraft({ lng: move.draft?.lng ?? tree.location.lng, lat });
                    }
                  }}
                  className="mono-num w-full rounded bg-paper px-2 py-1.5 text-sm hairline focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">Longitude</span>
                <input
                  type="number"
                  step={0.000001}
                  value={move.draft?.lng ?? tree.location.lng}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value);
                    if (!Number.isNaN(lng)) {
                      move.setDraft({ lat: move.draft?.lat ?? tree.location.lat, lng });
                    }
                  }}
                  className="mono-num w-full rounded bg-paper px-2 py-1.5 text-sm hairline focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => move.cancel()}>
              Cancel
            </Button>
            <Button type="button" onClick={saveMove} disabled={moveTree.isPending}>
              {moveTree.isPending ? 'Saving…' : 'Save location'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
          <TreeDetailHeader
            commonName={tree.commonName}
            scientificName={tree.scientificName}
            onClose={close}
          />
          <TreeAttributesGrid tree={tree} />
          <TreeCustomFieldsList values={tree.customFields} />
          <TreePhotosStrip photos={tree.photos} />
          {canEdit ? (
            <TreeDetailActions
              onEdit={() => setEditing(true)}
              onMove={startMove}
              onDelete={handleDelete}
            />
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
