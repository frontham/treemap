'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type LayersContextValue = {
  visibility: Record<string, boolean>;
  opacity: Record<string, number>;
  setVisible: (id: string, v: boolean) => void;
  setOpacity: (id: string, o: number) => void;
};

const LayersContext = createContext<LayersContextValue>({
  visibility: {},
  opacity: {},
  setVisible: () => {},
  setOpacity: () => {},
});

// Overlay ids are unique per project, so a single store is effectively
// per-project. Persists each overlay's last on/off + opacity across reloads.
const STORAGE_KEY = 'treemap.layers';
type Persisted = { visibility: Record<string, boolean>; opacity: Record<string, number> };

function loadPersisted(): Persisted {
  if (typeof window === 'undefined') return { visibility: {}, opacity: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      return { visibility: p.visibility ?? {}, opacity: p.opacity ?? {} };
    }
  } catch {
    /* corrupt/unavailable — start fresh */
  }
  return { visibility: {}, opacity: {} };
}

/**
 * Per-overlay visibility + opacity, remembered across reloads (localStorage).
 * Server defaults apply when an id has no stored entry, so newly created
 * overlays show by default while any toggle the user makes is remembered.
 */
export function LayersProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibilityState] = useState<Record<string, boolean>>(
    () => loadPersisted().visibility,
  );
  const [opacity, setOpacityState] = useState<Record<string, number>>(
    () => loadPersisted().opacity,
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ visibility, opacity }));
    } catch {
      /* private mode / quota — ignore */
    }
  }, [visibility, opacity]);

  const setVisible = (id: string, v: boolean) =>
    setVisibilityState((prev) => ({ ...prev, [id]: v }));

  const setOpacity = (id: string, o: number) =>
    setOpacityState((prev) => ({ ...prev, [id]: o }));

  return (
    <LayersContext.Provider value={{ visibility, opacity, setVisible, setOpacity }}>
      {children}
    </LayersContext.Provider>
  );
}

export function useLayers() {
  return useContext(LayersContext);
}

export function isLayerVisible(state: LayersContextValue, id: string): boolean {
  return state.visibility[id] !== false;
}

export function resolveLayerOpacity(
  state: LayersContextValue,
  id: string,
  fallback: number,
): number {
  return state.opacity[id] ?? fallback;
}
