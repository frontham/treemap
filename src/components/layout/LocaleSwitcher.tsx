'use client';

import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';

/** The segmented language picker shared by the account dropdown and mobile menu. */
export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="grid grid-cols-2 gap-1 rounded bg-panel p-0.5 hairline">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            'rounded px-2 py-1 text-xs transition-colors',
            locale === l ? 'bg-paper font-medium text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
