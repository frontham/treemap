import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from 'serwist';
import { defaultCache } from '@serwist/next/worker';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Basemap hosts (styles, glyphs, sprites and tiles — all GETs to these hosts).
 * Cached cache-first as you browse, so areas viewed online keep rendering
 * offline. Mirrors the hosts in src/components/map/basemaps.ts.
 */
const TILE_HOSTS = new Set([
  'tiles.openfreemap.org',
  'tiles.versatiles.org',
  'service.pdok.nl',
  'server.arcgisonline.com',
  'tiles.maps.eox.at',
]);
const isTileHost = (hostname: string) =>
  TILE_HOSTS.has(hostname) ||
  hostname.endsWith('.tile.opentopomap.org') ||
  hostname.endsWith('.basemaps.cartocdn.com');

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, request }) => request.method === 'GET' && isTileHost(url.hostname),
      handler: new CacheFirst({
        cacheName: 'basemap-tiles',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 2500,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            maxAgeFrom: 'last-used',
          }),
        ],
      }),
    },
    // The API stays network-only: offline DATA is the React Query persistence
    // layer's job (typed, per-query) — not stale HTTP responses from the SW.
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  // Navigations that miss both network and cache land on the offline page.
  fallbacks: {
    entries: [{ url: '/~offline', matcher: ({ request }) => request.destination === 'document' }],
  },
});

serwist.addEventListeners();
