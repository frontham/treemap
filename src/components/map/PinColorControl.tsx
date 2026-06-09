'use client';

import { usePinColor } from './PinColorContext';
import { PIN_COLOR_OPTIONS, type PinColorBy } from './pinColor';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';

// Reuse the existing field labels for the attributes; 'none' is control-specific.
const LABEL_KEY: Record<PinColorBy, string> = {
  health: 'field.health',
  condition: 'field.condition',
  risk: 'field.risk',
  none: 'pinColor.none',
};

/**
 * Lets the user pick which tree attribute colours the map pins (or 'none' to
 * turn colour-coding off). Shared by the desktop Layers panel and the mobile
 * layers sheet; reads/writes the PinColor context.
 */
export function PinColorControl() {
  const t = useT();
  const { colorBy, setColorBy } = usePinColor();

  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{t('pinColor.label')}</p>
      <div
        role="group"
        aria-label={t('pinColor.label')}
        className="grid grid-cols-2 gap-1 rounded bg-panel p-0.5 hairline"
      >
        {PIN_COLOR_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setColorBy(opt)}
            aria-pressed={colorBy === opt}
            className={cn(
              'rounded px-2 py-1 text-xs transition-colors',
              colorBy === opt ? 'bg-paper font-medium text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {t(LABEL_KEY[opt])}
          </button>
        ))}
      </div>
    </div>
  );
}
