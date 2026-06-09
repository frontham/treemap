'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * How dead trees (health === 'dead') are drawn on the map:
 *   - 'show' — like any other tree (default)
 *   - 'dim'  — semi-transparent so they recede but stay visible
 *   - 'hide' — removed from the map entirely (also drops them from clusters)
 */
export type DeadTreeMode = 'show' | 'dim' | 'hide';

export const DEAD_TREE_MODES: DeadTreeMode[] = ['show', 'dim', 'hide'];

type DeadTreesContextValue = {
  mode: DeadTreeMode;
  setMode: (m: DeadTreeMode) => void;
};

const DeadTreesContext = createContext<DeadTreesContextValue>({
  mode: 'show',
  setMode: () => {},
});

// One choice per device, remembered across reloads (like the basemap pick).
const STORAGE_KEY = 'treemap.deadTrees';

function loadPersisted(): DeadTreeMode {
  if (typeof window === 'undefined') return 'show';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'dim' || v === 'hide' ? v : 'show';
}

/** Holds the dead-tree display preference; consumed by the map and the control. */
export function DeadTreesProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DeadTreeMode>(loadPersisted);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* private mode / quota — ignore, falls back to default next load */
    }
  }, [mode]);

  return (
    <DeadTreesContext.Provider value={{ mode, setMode }}>{children}</DeadTreesContext.Provider>
  );
}

export function useDeadTrees() {
  return useContext(DeadTreesContext);
}
