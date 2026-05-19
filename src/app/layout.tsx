import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { OfflineProvider } from '@/components/providers/OfflineProvider';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <QueryProvider>
          <OfflineProvider>{children}</OfflineProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
