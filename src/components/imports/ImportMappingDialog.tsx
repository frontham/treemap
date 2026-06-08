'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import { cn } from '@/lib/cn';
import type { ImportTransform } from '@/server/db/schema/projects';

export type ImportSource =
  | { kind: 'csv'; csv: string; columns: string[] }
  | { kind: 'geojson'; features: unknown[]; columns: string[] };

type Transform = ImportTransform | '';
type ColMap = { target: string; transform: Transform };

const STANDARD_TARGETS: { value: string; key: string }[] = [
  { value: 'commonName', key: 'field.commonName' },
  { value: 'scientificName', key: 'field.scientificName' },
  { value: 'health', key: 'field.health' },
  { value: 'condition', key: 'field.condition' },
  { value: 'risk', key: 'field.risk' },
  { value: 'dbhCm', key: 'field.dbh' },
  { value: 'heightM', key: 'field.height' },
  { value: 'canopyRadiusM', key: 'field.canopy' },
  { value: 'estimatedAgeYears', key: 'field.age' },
  { value: 'plantedDate', key: 'field.planted' },
  { value: 'nextInspectionOn', key: 'field.nextDue' },
  { value: 'treeNo', key: 'field.treeNo' },
  { value: 'notes', key: 'field.notes' },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const GUESS: Record<string, string> = {
  commonname: 'commonName', name: 'commonName',
  scientificname: 'scientificName', species: 'scientificName',
  health: 'health', gezondheid: 'health',
  condition: 'condition', conditie: 'condition',
  risk: 'risk', riskrating: 'risk', risico: 'risk',
  dbh: 'dbhCm', dbhcm: 'dbhCm', diameter: 'dbhCm',
  height: 'heightM', heightm: 'heightM', hoogte: 'heightM',
  canopy: 'canopyRadiusM', canopyradius: 'canopyRadiusM', kroonstraal: 'canopyRadiusM',
  age: 'estimatedAgeYears', leeftijd: 'estimatedAgeYears',
  planted: 'plantedDate', planteddate: 'plantedDate',
  notes: 'notes', opmerkingen: 'notes',
};
const guessTarget = (col: string) => GUESS[norm(col)] ?? 'custom';

function guessCoord(columns: string[], wanted: string[]): string {
  return columns.find((c) => wanted.includes(norm(c))) ?? '';
}

/** Maps a source file's columns onto tree fields, then imports. */
export function ImportMappingDialog({ source, onClose }: { source: ImportSource; onClose: () => void }) {
  const t = useT();
  const utils = trpc.useUtils();
  const { data: saved } = trpc.imports.mapping.useQuery();

  const isCsv = source.kind === 'csv';
  const [lngColumn, setLngColumn] = useState('');
  const [latColumn, setLatColumn] = useState('');
  const [cols, setCols] = useState<Record<string, ColMap>>({});
  const [save, setSave] = useState(false);
  const [ready, setReady] = useState(false);

  // Initialize once the saved mapping (if any) has loaded.
  useEffect(() => {
    if (ready) return;
    const lng = isCsv ? (saved?.lngColumn ?? guessCoord(source.columns, ['lng', 'longitude', 'x', 'lon'])) : '';
    const lat = isCsv ? (saved?.latColumn ?? guessCoord(source.columns, ['lat', 'latitude', 'y'])) : '';
    setLngColumn(lng);
    setLatColumn(lat);
    const init: Record<string, ColMap> = {};
    for (const c of source.columns) {
      const savedCol = saved?.columns?.[c];
      init[c] = savedCol
        ? { target: savedCol.target, transform: savedCol.transform ?? '' }
        : { target: guessTarget(c), transform: '' };
    }
    setCols(init);
    setReady(true);
  }, [saved, ready, isCsv, source.columns]);

  const run = trpc.imports.run.useMutation({
    onSuccess: (r) => {
      utils.trees.list.invalidate();
      window.alert(`Imported ${r.imported} tree${r.imported === 1 ? '' : 's'}, skipped ${r.skipped}.`);
      onClose();
    },
    onError: (e) => window.alert(`Import failed: ${e.message}`),
  });

  const tableColumns = source.columns.filter((c) => !isCsv || (c !== lngColumn && c !== latColumn));

  const onImport = () => {
    const columns: Record<string, { target: string; transform?: ImportTransform }> = {};
    for (const c of tableColumns) {
      const m = cols[c];
      if (!m) continue;
      columns[c] = { target: m.target, transform: m.transform || undefined };
    }
    const mapping = {
      lngColumn: isCsv ? lngColumn : null,
      latColumn: isCsv ? latColumn : null,
      columns,
    };
    run.mutate({
      source: source.kind === 'csv' ? { kind: 'csv', csv: source.csv } : { kind: 'geojson', features: source.features },
      mapping,
      save,
    });
  };

  const canImport = !isCsv || (!!lngColumn && !!latColumn);

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-paper p-5 shadow-floating hairline">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{t('import.title')}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-muted">{t('import.intro')}</p>

        {isCsv ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{t('import.lngColumn')}</span>
              <select className={inputBase} value={lngColumn} onChange={(e) => setLngColumn(e.target.value)}>
                <option value="">—</option>
                {source.columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{t('import.latColumn')}</span>
              <select className={inputBase} value={latColumn} onChange={(e) => setLatColumn(e.target.value)}>
                <option value="">—</option>
                {source.columns.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg hairline">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-panel text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{t('import.column')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('import.target')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('import.transform')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {tableColumns.map((c) => (
                <tr key={c}>
                  <td className="mono-num px-3 py-1.5 text-ink">{c}</td>
                  <td className="px-3 py-1.5">
                    <select
                      className={cn(inputBase, 'h-8')}
                      value={cols[c]?.target ?? 'custom'}
                      onChange={(e) => setCols((s) => ({ ...s, [c]: { target: e.target.value, transform: s[c]?.transform ?? '' } }))}
                    >
                      <option value="custom">{t('import.custom')}</option>
                      <option value="ignore">{t('import.ignore')}</option>
                      {STANDARD_TARGETS.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      className={cn(inputBase, 'h-8')}
                      value={cols[c]?.transform ?? ''}
                      onChange={(e) => setCols((s) => ({ ...s, [c]: { target: s[c]?.target ?? 'custom', transform: e.target.value as Transform } }))}
                    >
                      <option value="">{t('import.transformNone')}</option>
                      <option value="circumferenceToDbh">{t('import.transformCirc')}</option>
                      <option value="yearToDate">{t('import.transformYear')}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
            className="h-4 w-4 rounded border-hairline text-accent focus:ring-accent"
          />
          {t('import.saveMapping')}
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={onImport} disabled={run.isPending || !canImport}>
            {run.isPending ? t('import.importing') : t('import.run')}
          </Button>
        </div>
      </div>
    </div>
  );
}
