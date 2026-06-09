'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type FilterAttr = 'health' | 'condition' | 'risk';
export type Excluded = Record<FilterAttr, string[]>;

const EMPTY: Excluded = { health: [], condition: [], risk: [] };

type TreeFilterContextValue = {
  excluded: Excluded;
  toggle: (attr: FilterAttr, value: string) => void;
  clear: () => void;
  isExcluded: (attr: FilterAttr, value: string) => boolean;
  /** True when at least one value is filtered out. */
  active: boolean;
};

const TreeFilterContext = createContext<TreeFilterContextValue>({
  excluded: EMPTY,
  toggle: () => {},
  clear: () => {},
  isExcluded: () => false,
  active: false,
});

// Persists which attribute values are hidden, per device (like the other map prefs).
const STORAGE_KEY = 'treemap.treeFilters';

function loadPersisted(): Excluded {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Excluded>;
      return {
        health: Array.isArray(p.health) ? p.health : [],
        condition: Array.isArray(p.condition) ? p.condition : [],
        risk: Array.isArray(p.risk) ? p.risk : [],
      };
    }
  } catch {
    /* corrupt/unavailable — start fresh */
  }
  return EMPTY;
}

/**
 * Holds which attribute values are hidden from the map. A value is "excluded"
 * when the user unchecks it in the Filters panel; the map loader drops trees
 * whose value is excluded for any attribute.
 */
export function TreeFilterProvider({ children }: { children: ReactNode }) {
  const [excluded, setExcluded] = useState<Excluded>(loadPersisted);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(excluded));
    } catch {
      /* private mode / quota — ignore */
    }
  }, [excluded]);

  const toggle = useCallback((attr: FilterAttr, value: string) => {
    setExcluded((prev) => {
      const set = prev[attr];
      const next = set.includes(value) ? set.filter((v) => v !== value) : [...set, value];
      return { ...prev, [attr]: next };
    });
  }, []);

  const clear = useCallback(() => setExcluded(EMPTY), []);

  const value = useMemo<TreeFilterContextValue>(
    () => ({
      excluded,
      toggle,
      clear,
      isExcluded: (attr, val) => excluded[attr].includes(val),
      active:
        excluded.health.length > 0 ||
        excluded.condition.length > 0 ||
        excluded.risk.length > 0,
    }),
    [excluded, toggle, clear],
  );

  return <TreeFilterContext.Provider value={value}>{children}</TreeFilterContext.Provider>;
}

export function useTreeFilter() {
  return useContext(TreeFilterContext);
}

/** Shared predicate: true if a tree passes the active attribute filters. */
export function passesFilter(
  excluded: Excluded,
  props: { health: string; condition: string; risk: string },
): boolean {
  return (
    !excluded.health.includes(props.health) &&
    !excluded.condition.includes(props.condition) &&
    !excluded.risk.includes(props.risk)
  );
}
