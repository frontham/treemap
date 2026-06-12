'use client';

import { useState } from 'react';

/** Set-of-ids selection state: toggle one, bulk add/remove, reset to a list. */
export function useSelectionSet() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const has = (id: string) => selected.has(id);
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const add = (ids: Iterable<string>) => setSelected((s) => new Set([...s, ...ids]));
  const remove = (ids: Iterable<string>) =>
    setSelected((s) => {
      const next = new Set(s);
      for (const id of ids) next.delete(id);
      return next;
    });
  const reset = (ids: Iterable<string>) => setSelected(new Set(ids));

  return { selected, has, toggle, add, remove, reset };
}

export type SelectionSet = ReturnType<typeof useSelectionSet>;
