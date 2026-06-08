'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useRole } from '@/components/auth/useRole';
import { useT } from '@/lib/i18n/LocaleProvider';
import { ImportMappingDialog, type ImportSource } from '@/components/imports/ImportMappingDialog';

/**
 * Dropdown in the top bar for data actions.
 *   - Export downloads stream from /api/exports/*
 *   - Import reads a file in the browser and calls a tRPC mutation
 */
export function DataMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const geojsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const { can } = useRole();
  const t = useT();
  const canImport = can('editor');
  const [importSource, setImportSource] = useState<ImportSource | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleGeoJsonFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOpen(false);
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
      window.alert(`Couldn't parse GeoJSON: ${(err as Error).message}`);
    }
  };

  const handleCsvFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOpen(false);
    const csv = await file.text();
    setImportSource({ kind: 'csv', csv, columns: parseCsvHeader(csv) });
  };

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        className={cn('rounded-full shadow-floating', open && 'bg-paper')}
      >
        {t('data.menu')}
        <ChevronDownIcon size={14} className="text-muted" />
      </Button>

      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 w-56 overflow-hidden rounded-lg bg-paper hairline shadow-floating">
          <MenuLink href="/api/exports/trees.geojson" download>
            {t('data.exportGeojson')}
          </MenuLink>
          <MenuLink href="/api/exports/trees.csv" download>
            {t('data.exportCsv')}
          </MenuLink>
          {canImport ? (
            <>
              <div className="h-px bg-hairline" />
              <MenuButton onClick={() => geojsonInputRef.current?.click()}>
                {t('data.importGeojson')}
              </MenuButton>
              <MenuButton onClick={() => csvInputRef.current?.click()}>
                {t('data.importCsv')}
              </MenuButton>
            </>
          ) : null}
        </div>
      ) : null}

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
    </div>
  );
}

function MenuLink(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode },
) {
  return (
    <a
      {...props}
      className={cn(
        'block px-3 py-2 text-sm text-ink transition-colors hover:bg-panel',
        props.className,
      )}
    />
  );
}

function MenuButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-panel"
    >
      {children}
    </button>
  );
}

function parseCsvHeader(csv: string): string[] {
  const first = csv.split(/\r?\n/, 1)[0] ?? '';
  return first
    .split(',')
    .map((h) => h.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}
