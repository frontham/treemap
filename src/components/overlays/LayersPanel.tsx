'use client';

import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import { PinColorControl } from '@/components/map/PinColorControl';
import { DeadTreesControl } from '@/components/map/DeadTreesControl';
import { OverlayRow } from './OverlayRow';

/**
 * Floating card with the pin-colour + dead-tree display controls plus one row
 * per overlay. Anchored above the floating control cluster; shown/hidden by it.
 */
export function LayersPanel() {
  const t = useT();
  const { data: overlays = [] } = trpc.overlays.list.useQuery();

  return (
    <div className="pointer-events-auto absolute bottom-16 right-3 z-30 w-80 rounded-lg bg-panel/95 backdrop-blur-md hairline shadow-floating">
      <div className="border-b border-hairline p-3">
        <PinColorControl />
      </div>
      <div className="border-b border-hairline p-3">
        <DeadTreesControl />
      </div>
      <div className="border-b border-hairline px-3 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
          {t('layers.overlays')}
        </h3>
      </div>
      <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto p-2">
        {overlays.length === 0 ? (
          <p className="px-1.5 py-3 text-center text-xs text-muted">{t('layers.empty')}</p>
        ) : (
          overlays.map((o) => <OverlayRow key={o.id} overlay={o} />)
        )}
      </div>
    </div>
  );
}
