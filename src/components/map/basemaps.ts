import type { StyleSpecification } from 'maplibre-gl';
import { MAP_STYLE_URL } from './mapStyle';

/**
 * Selectable base maps for the basemap switcher. Each is either a full vector
 * style URL or a minimal raster StyleSpecification. All are free and require no
 * API key. Raster styles carry a `glyphs` URL so our cluster-count text layer
 * (which the switcher re-injects on top) still has a font to render with.
 */
export type BasemapId =
  | 'light'
  | 'streets'
  | 'streets-vt'
  | 'aerial-nl'
  | 'aerial-cir'
  | 'satellite'
  | 'sentinel2'
  | 'topo-nl'
  | 'topo'
  | 'dark-vt'
  | 'dark';

export type Basemap = {
  id: BasemapId;
  label: string;
  /** Short coverage/licensing hint shown under the label while comparing. */
  note?: string;
  style: string | StyleSpecification;
};

const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const ofm = (name: string) => `https://tiles.openfreemap.org/styles/${name}`;
const vt = (name: string) => `https://tiles.versatiles.org/assets/styles/${name}/style.json`;

function raster(tiles: string[], attribution: string, maxzoom = 19): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: { base: { type: 'raster', tiles, tileSize: 256, attribution, maxzoom } },
    layers: [{ id: 'base', type: 'raster', source: 'base' }],
  };
}

export const BASEMAPS: Basemap[] = [
  // --- free + unlimited + commercial-OK (OpenFreeMap) ---
  // Default light vector style; honors the existing env override.
  { id: 'light', label: 'Light', note: 'OpenFreeMap · free, unlimited', style: MAP_STYLE_URL },
  { id: 'streets', label: 'Streets', note: 'OpenFreeMap · free, unlimited', style: ofm('liberty') },
  {
    id: 'streets-vt',
    label: 'Streets (Versatiles)',
    note: 'Global · free incl. commercial',
    style: vt('colorful'),
  },

  // --- aerial / satellite (compare quality) ---
  {
    id: 'aerial-nl',
    label: 'Aerial NL (PDOK)',
    note: 'Netherlands · free incl. commercial · 7.5 cm',
    style: raster(
      ['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg'],
      'Luchtfoto © Beeldmateriaal Nederland / PDOK',
      19,
    ),
  },
  {
    id: 'aerial-cir',
    label: 'Aerial NL · infrared (PDOK)',
    note: 'Netherlands · free incl. commercial · vegetation/health',
    style: raster(
      ['https://service.pdok.nl/hwh/luchtfotocir/wmts/v1_0/Actueel_orthoHRIR/EPSG:3857/{z}/{x}/{y}.jpeg'],
      'Luchtfoto CIR © Beeldmateriaal Nederland / PDOK',
      19,
    ),
  },
  {
    id: 'satellite',
    label: 'Satellite (Esri)',
    note: 'Global · non-commercial',
    style: raster(
      ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      'Imagery © Esri, Maxar, Earthstar Geographics',
      19,
    ),
  },
  {
    id: 'sentinel2',
    label: 'Satellite (Sentinel-2)',
    note: 'Global · free incl. commercial · ~10 m',
    style: raster(
      ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg'],
      'Sentinel-2 cloudless 2023 by EOX (modified Copernicus Sentinel data)',
      16,
    ),
  },

  // --- topographic ---
  {
    id: 'topo-nl',
    label: 'Topo NL (PDOK)',
    note: 'Netherlands · free incl. commercial',
    style: raster(
      ['https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png'],
      '© Kadaster / PDOK (BRT Achtergrondkaart)',
      19,
    ),
  },
  {
    id: 'topo',
    label: 'Topographic (OTM)',
    note: 'Global · non-commercial',
    style: raster(
      [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      '© OpenTopoMap (CC-BY-SA) · © OpenStreetMap contributors',
      17,
    ),
  },

  // --- dark ---
  {
    id: 'dark-vt',
    label: 'Dark (Versatiles)',
    note: 'Global · free incl. commercial',
    style: vt('eclipse'),
  },
  {
    id: 'dark',
    label: 'Dark (CARTO)',
    note: 'Non-commercial',
    style: raster(
      [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      '© CARTO · © OpenStreetMap contributors',
      20,
    ),
  },
];

export const DEFAULT_BASEMAP_ID: BasemapId = 'light';

export function getBasemap(id: BasemapId): Basemap {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0]!;
}

// --- persistence -----------------------------------------------------------
const STORAGE_KEY = 'treemap.basemap';

export function readStoredBasemapId(): BasemapId {
  if (typeof window === 'undefined') return DEFAULT_BASEMAP_ID;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v && BASEMAPS.some((b) => b.id === v) ? (v as BasemapId) : DEFAULT_BASEMAP_ID;
}

export function storeBasemapId(id: BasemapId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode / quota — ignore, falls back to default next load */
  }
}

// --- style swapping --------------------------------------------------------
// Our app layers/sources sit on top of the base style. Identify them by id so
// they can be carried across a setStyle() swap instead of being wiped.
const APP_LAYER_PREFIXES = ['trees-', 'pending-trees', 'overlay-', 'ref-'];
const APP_SOURCE_PREFIXES = ['overlay-'];
const APP_SOURCE_IDS = new Set(['trees', 'pending-trees', 'ref-image', 'ref-fit']);

const isAppLayerId = (id: string) => APP_LAYER_PREFIXES.some((p) => id.startsWith(p));
const isAppSourceId = (id: string) =>
  APP_SOURCE_IDS.has(id) || APP_SOURCE_PREFIXES.some((p) => id.startsWith(p));

/**
 * `transformStyle` for map.setStyle(): drops the previous base layers but
 * re-injects our app sources/layers (trees, overlays, reference image) on top
 * of the incoming base, preserving their data and relative order. Markers
 * (drag handles, draft pins) are DOM and survive on their own.
 */
export function carryAppLayers(
  prev: StyleSpecification | undefined,
  next: StyleSpecification,
): StyleSpecification {
  if (!prev) return next;
  const sources = { ...next.sources };
  for (const [id, src] of Object.entries(prev.sources)) {
    if (isAppSourceId(id)) sources[id] = src;
  }
  const baseLayerIds = new Set(next.layers.map((l) => l.id));
  const appLayers = prev.layers.filter((l) => isAppLayerId(l.id) && !baseLayerIds.has(l.id));
  return { ...next, sources, layers: [...next.layers, ...appLayers] };
}
