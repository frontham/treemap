'use client';

import { usePinColor } from './PinColorContext';
import { useAlign } from './AlignContext';
import { pinColorLegend } from './pinColor';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useHydrated } from '@/lib/useHydrated';

/**
 * Small key in the bottom-left explaining what the pin colours mean for the
 * active attribute. Hidden when colour-coding is off, and while an editor tool
 * panel occupies the bottom-left, so the two never overlap.
 */
export function PinLegend() {
  const t = useT();
  const { colorBy } = usePinColor();
  const { tool } = useAlign();
  const hydrated = useHydrated();

  // `colorBy` comes from localStorage, so it differs between the server (default)
  // and the client. Render nothing until hydrated so the first client paint
  // matches the server; the legend then appears with the real choice.
  if (!hydrated || colorBy === 'none' || tool !== 'none') return null;
  const rows = pinColorLegend(colorBy);

  return (
    <div className="pointer-events-none absolute bottom-16 left-4 z-20">
      <div className="rounded-lg bg-panel/85 px-2.5 py-2 backdrop-blur-md hairline shadow-floating">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
          {t(`field.${colorBy}`)}
        </p>
        <ul className="flex flex-col gap-1">
          {rows.map((r) => (
            <li key={r.valueKeys[0]} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white"
                style={{ backgroundColor: r.color }}
              />
              <span className="text-xs text-ink">
                {r.valueKeys.map((k) => t(k)).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
