'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { useDateFormatter } from '@/lib/i18n/useDateFormatter';
import type { InspectionView } from '@/server/trpc/routers/inspections';
import type { SelectionSet } from '@/lib/useSelectionSet';

/** Checkbox list choosing which inspections go into the report. */
export function InspectionPicker({
  inspections,
  selection,
}: {
  inspections: InspectionView[];
  selection: SelectionSet;
}) {
  const t = useT();
  const fmtDate = useDateFormatter();
  if (inspections.length === 0) return null;
  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-wider text-muted">
        {t('report.inspections')}
      </legend>
      <div className="mt-2 flex flex-col gap-1">
        {inspections.map((i) => (
          <label
            key={i.id}
            className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-paper/60"
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-accent"
              checked={selection.has(i.id)}
              onChange={() => selection.toggle(i.id)}
            />
            <span className="min-w-0">
              {fmtDate(i.inspectedOn)}
              <span className="block text-xs text-muted">
                {t(`health.${i.health}`)} · {t(`condition.${i.condition}`)}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
