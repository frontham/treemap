'use client';

import { useMemo } from 'react';
import { useLocale } from './LocaleProvider';

type DateStyle = 'long' | 'short';

const OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  short: { day: 'numeric', month: 'numeric', year: 'numeric' },
};

/**
 * Locale-aware date formatter following the app locale (not the browser's).
 * Returns undefined for empty input so callers can fall back (e.g. to an em dash).
 */
export function useDateFormatter(style: DateStyle = 'long') {
  const { locale } = useLocale();
  return useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', OPTIONS[style]);
    return (d: string | Date | null | undefined): string | undefined =>
      d ? fmt.format(new Date(d)) : undefined;
  }, [locale, style]);
}
