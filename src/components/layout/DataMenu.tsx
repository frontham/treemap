'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useRole } from '@/components/auth/useRole';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useImport } from '@/components/imports/useImport';

/**
 * Dropdown in the top bar for data actions.
 *   - Export downloads stream from /api/exports/*
 *   - Import reads a file in the browser and calls a tRPC mutation
 */
export function DataMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { can } = useRole();
  const t = useT();
  const canImport = can('editor');
  const { openGeoJson, openCsv, importUi } = useImport();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

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
              <MenuButton
                onClick={() => {
                  setOpen(false);
                  openGeoJson();
                }}
              >
                {t('data.importGeojson')}
              </MenuButton>
              <MenuButton
                onClick={() => {
                  setOpen(false);
                  openCsv();
                }}
              >
                {t('data.importCsv')}
              </MenuButton>
            </>
          ) : null}
        </div>
      ) : null}

      {importUi}
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
