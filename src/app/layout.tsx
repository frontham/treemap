import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { OfflineProvider } from '@/components/providers/OfflineProvider';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/lib/i18n/config';
import '@/styles/globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TreeMap',
  description: 'Document trees on the map.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable}`}>
      <body>
        <QueryProvider>
          <OfflineProvider>
            <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
          </OfflineProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
