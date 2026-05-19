'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

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

/**
 * Ephemeral per-session overrides for overlay visibility and opacity.
 * Server defaults apply when an id has no entry here.
 */
export function LayersProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibilityState] = useState<Record<string, boolean>>({});
  const [opacity, setOpacityState] = useState<Record<string, number>>({});

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
