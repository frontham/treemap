'use client';

import { BackHeader } from '@/components/ui/menu';
import { PinColorControl } from '@/components/map/PinColorControl';
import { DeadTreesControl } from '@/components/map/DeadTreesControl';
import { TreeFilterControl } from '@/components/map/TreeFilterControl';
import { OverlayRow } from '@/components/overlays/OverlayRow';
import type { OverlayView } from '@/server/trpc/routers/overlays';
import { useT } from '@/lib/i18n/LocaleProvider';

/** Mobile menu sub-view: pin colour / dead trees / filter controls + the overlay list. */
export function LayersView({ overlays, onBack }: { overlays: OverlayView[]; onBack: () => void }) {
  const t = useT();
  return (
    <>
      <BackHeader label={t('controls.layers')} onBack={onBack} />
      <div className="border-b border-hairline p-3">
        <PinColorControl />
      </div>
      <div className="border-b border-hairline p-3">
        <DeadTreesControl />
      </div>
      <div className="border-b border-hairline p-3">
        <TreeFilterControl />
      </div>
      <div className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted">
        {t('layers.overlays')}
      </div>
      <div className="flex flex-col gap-1.5 p-2 pt-1">
        {overlays.length === 0 ? (
          <p className="px-1.5 py-3 text-center text-xs text-muted">{t('layers.empty')}</p>
        ) : (
          overlays.map((o) => <OverlayRow key={o.id} overlay={o} />)
        )}
      </div>
    </>
  );
}
