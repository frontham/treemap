'use client';

import { BASEMAPS, type BasemapId } from './basemaps';
import { cn } from '@/lib/cn';

/**
 * The selectable basemap rows (label + note + ✓ on the current one), shared by
 * the desktop switcher dropdown and the mobile menu's basemap sub-view.
 */
export function BasemapList({
  value,
  onSelect,
}: {
  value: BasemapId;
  onSelect: (id: BasemapId) => void;
}) {
  return (
    <>
      {BASEMAPS.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSelect(b.id)}
          className={cn(
            'flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-panel',
            b.id === value && 'bg-panel',
          )}
        >
          <span className="min-w-0">
            <span className={cn('block text-sm text-ink', b.id === value && 'font-medium')}>
              {b.label}
            </span>
            {b.note ? <span className="block text-xs text-muted">{b.note}</span> : null}
          </span>
          {b.id === value ? <span className="mt-0.5 shrink-0 text-xs text-accent">✓</span> : null}
        </button>
      ))}
    </>
  );
}
