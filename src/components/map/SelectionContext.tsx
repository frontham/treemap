'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type SelectionContextValue = {
  selectedId: string | null;
  select: (id: string | null) => void;
};

const SelectionContext = createContext<SelectionContextValue>({
  selectedId: null,
  select: () => {},
});

/**
 * Holds the id of the currently selected tree. The drawer fetches the full
 * record via tRPC keyed off this id, so a click handler only needs an id
 * to express "show me this tree".
 */
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <SelectionContext.Provider value={{ selectedId, select: setSelectedId }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}
