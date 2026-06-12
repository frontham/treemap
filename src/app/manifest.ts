import type { MetadataRoute } from 'next';
import { colors } from '@/styles/tokens';

/** Web app manifest — makes the app installable (Android install prompt;
 *  iOS via Safari's share sheet → Add to Home Screen). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TreeMap',
    short_name: 'TreeMap',
    description: 'Document trees on the map.',
    start_url: '/',
    display: 'standalone',
    background_color: colors.paper,
    theme_color: colors.paper,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
