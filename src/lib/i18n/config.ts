export const LOCALES = ['en', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'nl';
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Pure lookup used by both the client provider and the server helper. */
export function translate(
  locale: Locale,
  messages: Record<Locale, Record<string, string>>,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let s = messages[locale]?.[key] ?? messages.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}
