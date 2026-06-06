'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type LngLat = { lng: number; lat: number };

type TreeMoveValue = {
  /** Tree currently being relocated, if any. */
  movingId: string | null;
  /** Pending (unsaved) location — driven by the map marker and the sidebar inputs. */
  draft: LngLat | null;
  begin: (id: string, at: LngLat) => void;
  setDraft: (at: LngLat) => void;
  cancel: () => void;
};

const TreeMoveContext = createContext<TreeMoveValue>({
  movingId: null,
  draft: null,
  begin: () => {},
  setDraft: () => {},
  cancel: () => {},
});

/**
 * Shared "move this tree" state. The map ([TreeMoveHandler]) renders a draggable
 * marker bound to `draft`; the sidebar edits the same `draft` and commits it via
 * trees.move. Nothing persists until the sidebar saves.
 */
export function TreeMoveProvider({ children }: { children: ReactNode }) {
  const [movingId, setMovingId] = useState<string | null>(null);
  const [draft, setDraftState] = useState<LngLat | null>(null);

  const begin = useCallback((id: string, at: LngLat) => {
    setMovingId(id);
    setDraftState(at);
  }, []);
  const setDraft = useCallback((at: LngLat) => setDraftState(at), []);
  const cancel = useCallback(() => {
    setMovingId(null);
    setDraftState(null);
  }, []);

  return (
    <TreeMoveContext.Provider value={{ movingId, draft, begin, setDraft, cancel }}>
      {children}
    </TreeMoveContext.Provider>
  );
}

export function useTreeMove() {
  return useContext(TreeMoveContext);
}
