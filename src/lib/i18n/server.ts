import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, translate, type Translate } from './config';
import { messages } from './messages';

/**
 * Server-side translator for server components (reads the locale cookie).
 * Client components use useT() from LocaleProvider instead.
 */
export async function getServerT(): Promise<Translate> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  return (key, vars) => translate(locale, messages, key, vars);
}
