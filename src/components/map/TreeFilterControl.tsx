'use client';

import { useTreeFilter, type FilterAttr } from './TreeFilterContext';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';

// Each attribute's possible values (mirrors the DB enums). Every value is shown
// as a chip; chips are "on" by default and unchecking one hides those trees.
const GROUPS: Array<{ attr: FilterAttr; values: string[] }> = [
  { attr: 'health', values: ['healthy', 'fair', 'poor', 'dead', 'unknown'] },
  { attr: 'condition', values: ['excellent', 'good', 'fair', 'poor', 'critical', 'unknown'] },
  { attr: 'risk', values: ['low', 'moderate', 'high', 'unknown'] },
];

/**
 * Filter the map by attribute value: one chip per value, "on" by default.
 * Unchecking a chip hides trees with that value. Shared by the desktop Filters
 * panel and the mobile layers sheet; reads/writes the TreeFilter context.
 */
export function TreeFilterControl() {
  const t = useT();
  const { isExcluded, toggle, clear, active } = useTreeFilter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {t('controls.filters')}
        </p>
        {active ? (
          <button type="button" onClick={clear} className="text-xs text-accent hover:underline">
            {t('filters.reset')}
          </button>
        ) : null}
      </div>

      {GROUPS.map(({ attr, values }) => (
        <div key={attr}>
          <p className="mb-1 text-xs text-muted">{t(`field.${attr}`)}</p>
          <div className="flex flex-wrap gap-1">
            {values.map((v) => {
              const off = isExcluded(attr, v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(attr, v)}
                  aria-pressed={!off}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs transition-colors hairline',
                    off ? 'bg-transparent text-muted line-through opacity-60' : 'bg-paper text-ink',
                  )}
                >
                  {t(`${attr}.${v}`)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
