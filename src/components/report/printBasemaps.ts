import type { BasemapId } from '@/components/map/basemaps';

/**
 * Basemaps that work on paper (light, print-friendly, licensing OK), with the
 * attribution line printed under the snapshots (the report has no live
 * attribution control). The PDOK pair is NL-only and offered only when the
 * tree is in the Netherlands.
 */
export const PRINT_BASEMAPS: { id: BasemapId; nlOnly?: boolean; attribution: string }[] = [
  { id: 'topo-nl', nlOnly: true, attribution: '© Kadaster / PDOK (BRT Achtergrondkaart)' },
  { id: 'aerial-nl', nlOnly: true, attribution: 'Luchtfoto © Beeldmateriaal Nederland / PDOK' },
  { id: 'streets', attribution: '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors' },
  { id: 'light', attribution: '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors' },
];

export const inNetherlands = (loc: { lng: number; lat: number }) =>
  loc.lng > 3.2 && loc.lng < 7.3 && loc.lat > 50.7 && loc.lat < 53.6;

export const printAttribution = (id: BasemapId) =>
  PRINT_BASEMAPS.find((b) => b.id === id)?.attribution ?? '© OpenStreetMap contributors';
