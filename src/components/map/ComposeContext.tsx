'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Cursor } from './MapContext';

type Mode = 'idle' | 'placing' | 'editing';

/** How the draft location was set — recorded as the tree's placed_via. */
export type PlaceSource = 'map_click' | 'current_location';
export type DraftMeta = { source: PlaceSource; accuracyM?: number };

export type ComposeContextValue = {
  mode: Mode;
  draft: Cursor | null;
  /** Provenance of the current draft (map tap vs. device GPS). */
  source: PlaceSource;
  /** GPS accuracy in metres, when the draft came from the device location. */
  accuracyM?: number;
  startPlacing: () => void;
  setDraft: (loc: Cursor, meta?: DraftMeta) => void;
  cancel: () => void;
};

const ComposeContext = createContext<ComposeContextValue>({
  mode: 'idle',
  draft: null,
  source: 'map_click',
  startPlacing: () => {},
  setDraft: () => {},
  cancel: () => {},
});

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [draft, setDraftState] = useState<Cursor | null>(null);
  const [source, setSource] = useState<PlaceSource>('map_click');
  const [accuracyM, setAccuracyM] = useState<number | undefined>(undefined);

  const startPlacing = () => {
    setMode('placing');
    setDraftState(null);
    setSource('map_click');
    setAccuracyM(undefined);
  };

  const setDraft = (loc: Cursor, meta?: DraftMeta) => {
    setDraftState(loc);
    setSource(meta?.source ?? 'map_click');
    setAccuracyM(meta?.accuracyM);
    setMode('editing');
  };

  const cancel = () => {
    setMode('idle');
    setDraftState(null);
  };

  return (
    <ComposeContext.Provider
      value={{ mode, draft, source, accuracyM, startPlacing, setDraft, cancel }}
    >
      {children}
    </ComposeContext.Provider>
  );
}

export function useCompose() {
  return useContext(ComposeContext);
}
