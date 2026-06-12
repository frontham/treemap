'use client';

import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { SelectionSet } from '@/lib/useSelectionSet';
import type { PhotoGroup } from './useTreeReportData';

/** Per-group photo thumbnails with toggle + all/none shortcuts. */
export function PhotoGroupPicker({
  groups,
  selection,
}: {
  groups: PhotoGroup[];
  selection: SelectionSet;
}) {
  const t = useT();
  if (groups.length === 0) return null;
  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-wider text-muted">
        {t('report.photos')}
      </legend>
      {groups.map((g) => (
        <div key={g.id} className="mt-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs text-muted">{g.label}</p>
            <p className="shrink-0 text-xs">
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => selection.add(g.photos.map((p) => p.id))}
              >
                {t('report.all')}
              </button>
              {' · '}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => selection.remove(g.photos.map((p) => p.id))}
              >
                {t('report.none')}
              </button>
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {g.photos.map((p) => {
              const on = selection.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => selection.toggle(p.id)}
                  className={cn(
                    'h-14 w-14 overflow-hidden rounded border transition-all',
                    on
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-hairline opacity-50 grayscale hover:opacity-80',
                  )}
                >
                  {p.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnailUrl}
                      alt={p.caption ?? ''}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
