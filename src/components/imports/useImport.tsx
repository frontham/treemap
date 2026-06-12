'use client';

import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ImportMappingDialog, type ImportSource } from './ImportMappingDialog';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useToast } from '@/components/ui/toast/ToastProvider';

/**
 * Shared file-import plumbing used by both the desktop Data menu and the mobile
 * menu. Owns the hidden file inputs, parses the chosen GeoJSON/CSV into an
 * ImportSource, and renders the mapping dialog. Callers trigger a picker with
 * openGeoJson/openCsv and render `importUi` somewhere persistent (so the dialog
 * survives the menu closing).
 */
export function useImport(): {
  openGeoJson: () => void;
  openCsv: () => void;
  importUi: ReactNode;
} {
  const t = useT();
  const toast = useToast();
  const geojsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importSource, setImportSource] = useState<ImportSource | null>(null);

  const handleGeoJsonFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text()) as { features?: unknown };
      const features = Array.isArray(json.features) ? json.features : [json];
      const keys = new Set<string>();
      for (const f of features) {
        const props = (f as { properties?: Record<string, unknown> } | null)?.properties;
        if (props) for (const k of Object.keys(props)) keys.add(k);
      }
      setImportSource({ kind: 'geojson', features, columns: [...keys] });
    } catch (err) {
      toast.error(t('import.parseFailed', { message: (err as Error).message }));
    }
  };

  const handleCsvFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const csv = await file.text();
    setImportSource({ kind: 'csv', csv, columns: parseCsvHeader(csv) });
  };

  const importUi = (
    <>
      <input
        ref={geojsonInputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        className="hidden"
        onChange={handleGeoJsonFile}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvFile}
      />
      {importSource ? (
        <ImportMappingDialog source={importSource} onClose={() => setImportSource(null)} />
      ) : null}
    </>
  );

  return {
    openGeoJson: () => geojsonInputRef.current?.click(),
    openCsv: () => csvInputRef.current?.click(),
    importUi,
  };
}

function parseCsvHeader(csv: string): string[] {
  const first = csv.split(/\r?\n/, 1)[0] ?? '';
  return first
    .split(',')
    .map((h) => h.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}
