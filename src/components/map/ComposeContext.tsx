'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Cursor } from './MapContext';

type Mode = 'idle' | 'placing' | 'editing';

export type ComposeContextValue = {
  mode: Mode;
  draft: Cursor | null;
  startPlacing: () => void;
  setDraft: (loc: Cursor) => void;
  cancel: () => void;
};

const ComposeContext = createContext<ComposeContextValue>({
  mode: 'idle',
  draft: null,
  startPlacing: () => {},
  setDraft: () => {},
  cancel: () => {},
});

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [draft, setDraftState] = useState<Cursor | null>(null);

  const startPlacing = () => {
    setMode('placing');
    setDraftState(null);
  };

  const setDraft = (loc: Cursor) => {
    setDraftState(loc);
    setMode('editing');
  };

  const cancel = () => {
    setMode('idle');
    setDraftState(null);
  };

  return (
    <ComposeContext.Provider value={{ mode, draft, startPlacing, setDraft, cancel }}>
      {children}
    </ComposeContext.Provider>
  );
}

export function useCompose() {
  return useContext(ComposeContext);
}
