/**
 * Field Notebook design tokens.
 * Mirror of tailwind.config.ts colors, for use in non-Tailwind contexts
 * (MapLibre paint props, canvas, server-side image processing).
 */
export const colors = {
  ink: '#0E1012',
  paper: '#FAFAF7',
  panel: '#F2F1ED',
  hairline: '#E2E1DC',
  muted: '#6B6B65',
  accent: '#E0530B',
  accentSoft: '#FBE8DA',
  sage: '#8FA384',
  sky: '#8AA3B0',
  warn: '#B7791F',
  danger: '#B23A30',
} as const;

export type ColorToken = keyof typeof colors;
