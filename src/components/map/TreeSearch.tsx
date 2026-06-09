'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pill } from '@/components/ui/Pill';
import { SearchIcon } from '@/components/icons';
import { useMap } from './MapContext';
import { useSelection } from './SelectionContext';
import { useSearch } from './SearchContext';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import { cn } from '@/lib/cn';

type Match = {
  id: string;
  name: string;
  /** Scientific name shown under the common name, when both exist. */
  sub: string | null;
  treeNo: number | null;
  lng: number;
  lat: number;
};

/**
 * Type-to-find search over the trees already loaded for the map. Matches on tree
 * number, common name and scientific name; picking a result selects that tree
 * (opening the drawer) and flies the map to it. Desktop-only, like the top bar.
 */
export function TreeSearch() {
  const t = useT();
  const { map } = useMap();
  const { select, selectedId } = useSelection();
  const { setHighlights } = useSearch();
  const { data } = trpc.trees.list.useQuery();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Every matching tree (sorted by relevance) — all get highlighted on the map.
  const matches = useMemo<Match[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !data) return [];
    const scored: Array<{ score: number; match: Match }> = [];
    for (const f of data.features) {
      const p = f.properties;
      const numStr = p.treeNo != null ? String(p.treeNo) : '';
      const common = p.commonName?.toLowerCase() ?? '';
      const sci = p.scientificName?.toLowerCase() ?? '';
      if (!numStr.includes(q) && !common.includes(q) && !sci.includes(q)) continue;
      let score = 3;
      if (numStr === q) score = 0;
      else if (numStr.startsWith(q)) score = 1;
      else if (common.startsWith(q) || sci.startsWith(q)) score = 2;
      scored.push({
        score,
        match: {
          id: p.id,
          name: p.commonName ?? p.scientificName ?? t('common.unknown'),
          sub: p.commonName && p.scientificName ? p.scientificName : null,
          treeNo: p.treeNo,
          lng: Number(f.geometry.coordinates[0]),
          lat: Number(f.geometry.coordinates[1]),
        },
      });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.map((s) => s.match);
  }, [query, data, t]);

  // The dropdown shows the top few; the map highlights them all.
  const results = useMemo(() => matches.slice(0, 8), [matches]);
  const showDropdown = open && query.trim().length > 0;

  useEffect(() => setActive(0), [query]);

  // Publish matches as map highlights while the search is active; clear otherwise.
  useEffect(() => {
    setHighlights(showDropdown ? matches.map((m) => [m.lng, m.lat]) : []);
  }, [showDropdown, matches, setHighlights]);

  useEffect(() => () => setHighlights([]), [setHighlights]);

  // Selecting a tree (from the dropdown OR by clicking a pin on the map) ends the
  // search, so the match highlights clear and don't compete with the selected pin.
  useEffect(() => {
    if (selectedId) {
      setQuery('');
      setOpen(false);
    }
  }, [selectedId]);

  // Close the dropdown when clicking outside the search.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (m: Match) => {
    select(m.id);
    map?.flyTo({ center: [m.lng, m.lat], zoom: Math.max(map.getZoom(), 18), essential: true });
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const m = results[active];
      if (m) pick(m);
    }
  };

  return (
    <div ref={ref} className="relative hidden sm:block">
      <Pill>
        <SearchIcon size={14} className="text-muted" />
        <input
          aria-label={t('search.placeholder')}
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-40 bg-transparent text-sm placeholder:text-muted focus:outline-none"
        />
      </Pill>

      {showDropdown ? (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-72 overflow-hidden rounded-lg bg-paper hairline shadow-floating">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted">{t('search.noResults')}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(m)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left',
                      i === active ? 'bg-panel' : 'hover:bg-panel',
                    )}
                  >
                    {m.treeNo != null ? (
                      <span className="mono-num shrink-0 text-xs text-muted">#{m.treeNo}</span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{m.name}</span>
                      {m.sub ? (
                        <span className="block truncate text-xs italic text-muted">{m.sub}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
