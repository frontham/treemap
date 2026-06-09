'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

/** [lng, lat] of each tree currently matching the search query. */
export type HighlightPoint = [number, number];

type SearchContextValue = {
  highlights: HighlightPoint[];
  setHighlights: (h: HighlightPoint[]) => void;
};

const SearchContext = createContext<SearchContextValue>({
  highlights: [],
  setHighlights: () => {},
});

/**
 * Bridges the search box to the map: TreeSearch publishes the coordinates of the
 * current matches here, and SearchHighlighter draws a halo on each.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [highlights, setHighlights] = useState<HighlightPoint[]>([]);
  return (
    <SearchContext.Provider value={{ highlights, setHighlights }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
