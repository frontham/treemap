'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { trpc } from '@/lib/trpc/client';

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

  const utils = trpc.useUtils();
  const importGeoJson = trpc.trees.importGeoJson.useMutation({
    onSuccess: (r) => {
      utils.trees.list.invalidate();
      window.alert(`Imported ${r.imported} tree${plural(r.imported)}, skipped ${r.skipped}.`);
    },
    onError: (e) => window.alert(`Import failed: ${e.message}`),
  });
  const importCsv = trpc.trees.importCsv.useMutation({
    onSuccess: (r) => {
      utils.trees.list.invalidate();
      window.alert(`Imported ${r.imported} tree${plural(r.imported)}, skipped ${r.skipped}.`);
    },
    onError: (e) => window.alert(`Import failed: ${e.message}`),
  });

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
      importGeoJson.mutate({ features });
    } catch (err) {
      window.alert(`Couldn't parse GeoJSON: ${(err as Error).message}`);
    }
  };

  const handleCsvFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOpen(false);
    importCsv.mutate({ csv: await file.text() });
  };

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        className={cn('rounded-full shadow-floating', open && 'bg-paper')}
      >
        Data
        <ChevronDownIcon size={14} className="text-muted" />
      </Button>

      {open ? (
        <div className="absolute right-0 mt-1.5 w-56 overflow-hidden rounded-lg bg-paper hairline shadow-floating">
          <MenuLink href="/api/exports/trees.geojson" download>
            Export as GeoJSON
          </MenuLink>
          <MenuLink href="/api/exports/trees.csv" download>
            Export as CSV
          </MenuLink>
          <div className="h-px bg-hairline" />
          <MenuButton onClick={() => geojsonInputRef.current?.click()}>
            Import GeoJSON…
          </MenuButton>
          <MenuButton onClick={() => csvInputRef.current?.click()}>
            Import CSV…
          </MenuButton>
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

function plural(n: number): string {
  return n === 1 ? '' : 's';
}
