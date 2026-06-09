import type { ExpressionSpecification } from 'maplibre-gl';
import { colors } from '@/styles/tokens';

/**
 * Which tree attribute drives the pin colour. 'none' paints every pin the same
 * neutral colour (colour-coding off).
 */
export type PinColorBy = 'health' | 'condition' | 'risk' | 'none';

export const PIN_COLOR_OPTIONS: PinColorBy[] = ['health', 'condition', 'risk', 'none'];

/** Fallback for unknown/missing values, and the single colour used by 'none'. */
const NEUTRAL = '#3F4248';

// Value → colour per attribute, using the shared green/amber/red token scale so
// the map reads the same way regardless of which attribute is selected.
const SCALES: Record<Exclude<PinColorBy, 'none'>, Array<[string, string]>> = {
  health: [
    ['healthy', colors.sage],
    ['fair', colors.warn],
    ['poor', colors.warn],
    ['dead', colors.danger],
  ],
  condition: [
    ['excellent', colors.sage],
    ['good', colors.sage],
    ['fair', colors.warn],
    ['poor', colors.danger],
    ['critical', colors.danger],
  ],
  risk: [
    ['low', colors.sage],
    ['moderate', colors.warn],
    ['high', colors.danger],
  ],
};

/**
 * Builds the MapLibre `circle-color` value for the chosen attribute: a `match`
 * expression on that feature property, falling back to neutral for unknown
 * values. 'none' is a flat neutral colour.
 */
export function pinColorExpression(by: PinColorBy): ExpressionSpecification | string {
  if (by === 'none') return NEUTRAL;
  const match: unknown[] = ['match', ['get', by]];
  for (const [value, color] of SCALES[by]) match.push(value, color);
  match.push(NEUTRAL); // unknown / missing
  return match as unknown as ExpressionSpecification;
}

/** One legend row: a colour and the value label keys (`<attr>.<value>`) it covers. */
export type PinLegendRow = { color: string; valueKeys: string[] };

/**
 * Compact legend for an attribute: one row per colour bucket (values that share
 * a colour are merged), with an explicit Unknown row for the neutral fallback.
 */
export function pinColorLegend(by: Exclude<PinColorBy, 'none'>): PinLegendRow[] {
  const rows: PinLegendRow[] = [];
  for (const [value, color] of SCALES[by]) {
    const last = rows[rows.length - 1];
    if (last && last.color === color) last.valueKeys.push(`${by}.${value}`);
    else rows.push({ color, valueKeys: [`${by}.${value}`] });
  }
  rows.push({ color: NEUTRAL, valueKeys: [`${by}.unknown`] });
  return rows;
}
