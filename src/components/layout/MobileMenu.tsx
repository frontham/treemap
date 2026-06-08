'use client';

import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { LayersIcon, MoreIcon } from '@/components/icons';
import { BasemapSwitcher } from '@/components/map/BasemapSwitcher';
import { UserLocationButton } from '@/components/map/UserLocationButton';
import { LayersPanel } from '@/components/overlays/LayersPanel';
import { DataMenu } from './DataMenu';
import { MapToolsMenu } from './MapToolsMenu';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';

/**
 * Mobile-only "..." menu (the desktop top-bar buttons and bottom control cluster
 * are hidden below `sm`). Folds location, layers, basemap, data, tools, and the
 * account menu into one popover so the small screen isn't littered with floating
 * controls. The interactive controls are the same components used on desktop —
 * here they're laid out as labelled rows.
 */
export function MobileMenu() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <>
      {layersOpen ? <LayersPanel /> : null}
      <div ref={rootRef} className="relative">
        <IconButton
          label={t('controls.menu')}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'rounded-full bg-panel/85 hairline shadow-floating backdrop-blur-md',
            open && 'bg-paper text-accent',
          )}
        >
          <MoreIcon size={18} />
        </IconButton>

        {open ? (
          <div className="absolute right-0 mt-1.5 w-64 rounded-lg bg-paper hairline shadow-floating">
            <Row label={t('controls.location')}>
              <UserLocationButton />
            </Row>
            <Row label={t('controls.layers')}>
              <IconButton
                label={t('controls.layers')}
                onClick={() => setLayersOpen((v) => !v)}
                className={cn('rounded-full', layersOpen && 'bg-panel text-accent')}
              >
                <LayersIcon size={16} />
              </IconButton>
            </Row>
            <Row label={t('controls.basemap')}>
              <BasemapSwitcher dropUp={false} />
            </Row>

            <div className="h-px bg-hairline" />
            <div className="flex flex-col gap-2 px-3 py-2">
              <DataMenu />
              <MapToolsMenu />
            </div>

            <div className="h-px bg-hairline" />
            <Row label={t('account.title')}>
              <UserMenu />
            </Row>
          </div>
        ) : null}
      </div>
    </>
  );
}

/** A labelled row: text on the left, the control on the right. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-sm text-ink">{label}</span>
      {children}
    </div>
  );
}
