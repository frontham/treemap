'use client';

import { useRef, useState } from 'react';
import { LayersIcon, FiltersIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/IconButton';
import { UserLocationButton } from '@/components/map/UserLocationButton';
import { FitProjectButton } from '@/components/map/FitProjectButton';
import { BasemapSwitcher } from '@/components/map/BasemapSwitcher';
import { useTreeFilter } from '@/components/map/TreeFilterContext';
import { LayersPanel } from '@/components/overlays/LayersPanel';
import { FiltersPanel } from '@/components/overlays/FiltersPanel';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useHydrated } from '@/lib/useHydrated';
import { useClickOutside } from '@/lib/useClickOutside';

type Panel = 'layers' | 'filters';

/**
 * Bottom-right floating cluster: layers, filters, basemap, my-location. The
 * layers and filters buttons each toggle a card above the cluster (only one
 * open at a time); a click outside closes it.
 */
export function FloatingControlCluster() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const { active } = useTreeFilter();
  // `active` derives from localStorage filters; only show the dot post-hydration
  // so the first client paint matches the server (no dot) and doesn't mismatch.
  const hydrated = useHydrated();
  const filtersActive = hydrated && active;

  // Close the open card on a click anywhere outside it (the panel and the toggle
  // buttons are all inside `ref`, so interacting with either is safe).
  useClickOutside(ref, () => setPanel(null), panel !== null);

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <div ref={ref}>
      {panel === 'layers' ? <LayersPanel /> : panel === 'filters' ? <FiltersPanel /> : null}
      {/* Shown on all sizes for now (mobile previously folded these into the top
          "..." menu — to be revisited in a later mobile pass). */}
      <div className="pointer-events-none absolute bottom-4 right-3 z-20 block">
        <div className="pointer-events-auto inline-flex items-center gap-0.5 rounded-full bg-panel/85 backdrop-blur-md hairline shadow-floating p-1">
          <IconButton
            label={t('controls.layers')}
            onClick={() => toggle('layers')}
            className={cn('rounded-full', panel === 'layers' && 'bg-paper text-accent')}
          >
            <LayersIcon size={16} />
          </IconButton>
          <IconButton
            label={t('controls.filters')}
            onClick={() => toggle('filters')}
            className={cn('relative rounded-full', panel === 'filters' && 'bg-paper text-accent')}
          >
            <FiltersIcon size={16} />
            {filtersActive ? (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
            ) : null}
          </IconButton>
          <BasemapSwitcher onActivate={() => setPanel(null)} />
          <FitProjectButton onActivate={() => setPanel(null)} />
          <UserLocationButton onActivate={() => setPanel(null)} />
        </div>
      </div>
    </div>
  );
}
