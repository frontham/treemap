'use client';

import { useRef, useState } from 'react';
import { type BasemapId } from './basemaps';
import { BasemapList } from './BasemapList';
import { useBasemapSelection } from './useBasemapSelection';
import { IconButton } from '@/components/ui/IconButton';
import { MapIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useClickOutside } from '@/lib/useClickOutside';

/**
 * Basemap switcher in the floating control cluster. Swaps the MapLibre base
 * style while preserving our trees/overlays/reference-image layers via
 * `carryAppLayers` (setStyle would otherwise wipe everything on top). The
 * choice is remembered in localStorage and applied on the next load.
 */
export function BasemapSwitcher({ onActivate }: { onActivate?: () => void }) {
  const t = useT();
  const { basemapId: id, selectBasemap } = useBasemapSelection();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  const select = (next: BasemapId) => {
    setOpen(false);
    selectBasemap(next);
  };

  return (
    <div className="relative" ref={ref}>
      <IconButton
        label={t('controls.basemap')}
        onClick={() => {
          if (!open) onActivate?.(); // close any open layers/filters card on open
          setOpen((v) => !v);
        }}
        className={cn('rounded-full', open && 'bg-paper text-accent')}
      >
        <MapIcon size={16} />
      </IconButton>

      {open ? (
        <div className="absolute bottom-full right-0 mb-2 max-h-[60vh] w-60 overflow-y-auto rounded-lg bg-paper hairline shadow-floating">
          <div className="sticky top-0 border-b border-hairline bg-paper px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted">
            {t('controls.basemap')}
          </div>
          <BasemapList value={id} onSelect={select} />
        </div>
      ) : null}
    </div>
  );
}
