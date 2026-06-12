'use client';

import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';
import { getBasemap, type BasemapId } from '@/components/map/basemaps';

/** Radio list of print-friendly basemaps for the report's map snapshots. */
export function BasemapPicker({
  options,
  value,
  onChange,
}: {
  options: BasemapId[];
  value: BasemapId;
  onChange: (id: BasemapId) => void;
}) {
  const t = useT();
  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-wider text-muted">
        {t('report.mapType')}
      </legend>
      <div className="mt-2 flex flex-col gap-1">
        {options.map((id) => (
          <label
            key={id}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
              value === id ? 'bg-paper hairline' : 'hover:bg-paper/60',
            )}
          >
            <input
              type="radio"
              name="report-basemap"
              className="accent-accent"
              checked={value === id}
              onChange={() => onChange(id)}
            />
            {getBasemap(id).label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
