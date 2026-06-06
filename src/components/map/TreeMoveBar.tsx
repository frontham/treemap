'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { trpc } from '@/lib/trpc/client';
import { useTreeMove } from './TreeMoveContext';

/**
 * Compact bottom bar shown while relocating a tree. Lives over the map (the
 * detail drawer is hidden during a move) so the draggable marker stays visible
 * on phones too. Drag the marker, tap the map, or type coordinates here;
 * Save commits via trees.move.
 */
export function TreeMoveBar() {
  const { movingId, draft, setDraft, cancel } = useTreeMove();
  const utils = trpc.useUtils();

  const moveTree = trpc.trees.move.useMutation({
    onSuccess: () => {
      utils.trees.list.invalidate();
      if (movingId) utils.trees.get.invalidate({ id: movingId });
      cancel();
    },
  });

  useEffect(() => {
    if (!movingId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [movingId, cancel]);

  if (!movingId || !draft) return null;
  const { lat, lng } = draft;
  const save = () => moveTree.mutate({ id: movingId, lng, lat });

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-30 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-xl bg-paper p-3 shadow-floating hairline">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Move tree</span>
        <span className="text-xs text-muted">tap the map or drag the marker</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Latitude</span>
          <input
            type="number"
            step={0.000001}
            value={lat}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) setDraft({ lng, lat: v });
            }}
            className="mono-num w-full rounded bg-panel px-2 py-1.5 text-sm hairline focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Longitude</span>
          <input
            type="number"
            step={0.000001}
            value={lng}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) setDraft({ lat, lng: v });
            }}
            className="mono-num w-full rounded bg-panel px-2 py-1.5 text-sm hairline focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => cancel()}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={moveTree.isPending}>
          {moveTree.isPending ? 'Saving…' : 'Save location'}
        </Button>
      </div>
    </div>
  );
}
