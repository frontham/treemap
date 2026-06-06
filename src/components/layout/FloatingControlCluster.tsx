'use client';

import { useState } from 'react';
import { LayersIcon, FiltersIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/IconButton';
import { LocateMeButton } from '@/components/map/LocateMeButton';
import { BasemapSwitcher } from '@/components/map/BasemapSwitcher';
import { LayersPanel } from '@/components/overlays/LayersPanel';
import { cn } from '@/lib/cn';

/**
 * Bottom-right floating cluster: layers, filters, locate-me.
 * Layers button toggles a panel of overlay controls above the cluster.
 */
export function FloatingControlCluster() {
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <>
      {layersOpen ? <LayersPanel /> : null}
      <div className="pointer-events-none absolute bottom-4 right-3 z-20">
        <div className="pointer-events-auto inline-flex items-center gap-0.5 rounded-full bg-panel/85 backdrop-blur-md hairline shadow-floating p-1">
          <IconButton
            label="Layers"
            onClick={() => setLayersOpen((v) => !v)}
            className={cn('rounded-full', layersOpen && 'bg-paper text-accent')}
          >
            <LayersIcon size={16} />
          </IconButton>
          <IconButton label="Filters" className="rounded-full">
            <FiltersIcon size={16} />
          </IconButton>
          <BasemapSwitcher />
          <LocateMeButton />
        </div>
      </div>
    </>
  );
}
