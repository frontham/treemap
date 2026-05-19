/**
 * Base map style. Defaults to OpenFreeMap's "positron" — free vector tiles,
 * no API key, light grayscale that fits the Field Notebook palette.
 * Override with NEXT_PUBLIC_MAP_STYLE_URL once a paid provider is configured.
 */
const FALLBACK = 'https://tiles.openfreemap.org/styles/positron';

export const MAP_STYLE_URL: string =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || FALLBACK;
