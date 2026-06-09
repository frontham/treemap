'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from './MapContext';
import { addTreeLayer } from './treeLayer';
import {
  BASEMAPS,
  carryAppLayers,
  getBasemap,
  readStoredBasemapId,
  storeBasemapId,
  type BasemapId,
} from './basemaps';
import { IconButton } from '@/components/ui/IconButton';
import { MapIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';

/**
 * Basemap switcher in the floating control cluster. Swaps the MapLibre base
 * style while preserving our trees/overlays/reference-image layers via
 * `carryAppLayers` (setStyle would otherwise wipe everything on top). The
 * choice is remembered in localStorage and applied on the next load.
 */
export function BasemapSwitcher({ onActivate }: { onActivate?: () => void }) {
  const { map } = useMap();
  const t = useT();
  const [id, setId] = useState<BasemapId>(() => readStoredBasemapId());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const select = (next: BasemapId) => {
    setOpen(false);
    if (!map || next === id) return;
    setId(next);
    storeBasemapId(next);
    // Default diff + transformStyle: only the base layers swap; our carried-over
    // app layers diff as unchanged, so trees/overlays don't flicker.
    map.setStyle(getBasemap(next).style, { transformStyle: carryAppLayers });
    // Defensive: if the trees source somehow didn't carry, re-add it (idempotent).
    map.once('styledata', () => addTreeLayer(map));
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
          {BASEMAPS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => select(b.id)}
              className={cn(
                'flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-panel',
                b.id === id && 'bg-panel',
              )}
            >
              <span className="min-w-0">
                <span className={cn('block text-sm text-ink', b.id === id && 'font-medium')}>
                  {b.label}
                </span>
                {b.note ? <span className="block text-xs text-muted">{b.note}</span> : null}
              </span>
              {b.id === id ? <span className="mt-0.5 shrink-0 text-xs text-accent">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
