import type { ExportTreeRow } from './fetchTreesForExport';

const COLUMNS: Array<keyof ExportTreeRow> = [
  'id',
  'common_name',
  'scientific_name',
  'health',
  'condition',
  'dbh_cm',
  'height_m',
  'canopy_radius_m',
  'estimated_age_years',
  'planted_date',
  'notes',
  'lng',
  'lat',
];

export function rowsToCsv(rows: ExportTreeRow[]): string {
  const header = [...COLUMNS, 'custom_fields'].join(',');
  const lines = rows.map((r) => {
    const cells = COLUMNS.map((c) => escape(r[c]));
    cells.push(escape(JSON.stringify(r.custom_fields ?? {})));
    return cells.join(',');
  });
  return [header, ...lines].join('\n');
}

function escape(v: unknown): string {
  if (v == null) return '';
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
