'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, translate, type Locale, type Translate } from './config';
import { messages } from './messages';

export type { Translate };

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translate;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

/**
 * Client-side i18n. The initial locale comes from the server (cookie) so the
 * first render matches and there's no hydration flash. Switching updates the
 * context (instant for client UI) and persists the cookie for later loads /
 * server-rendered strings.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const t = useCallback<Translate>((key, vars) => translate(locale, messages, key, vars), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT(): Translate {
  return useContext(LocaleContext).t;
}
