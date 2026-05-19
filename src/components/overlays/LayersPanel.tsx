'use client';

import { trpc } from '@/lib/trpc/client';
import { OverlayRow } from './OverlayRow';

/**
 * Floating card with one row per overlay. Anchored above the floating control
 * cluster; rendered/hidden by the cluster's open state.
 */
export function LayersPanel() {
  const { data: overlays = [] } = trpc.overlays.list.useQuery();

  return (
    <div className="pointer-events-auto absolute bottom-16 right-3 z-30 w-80 rounded-lg bg-panel/95 backdrop-blur-md hairline shadow-floating">
      <div className="border-b border-hairline px-3 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
          Overlays
        </h3>
      </div>
      <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto p-2">
        {overlays.length === 0 ? (
          <p className="px-1.5 py-3 text-center text-xs text-muted">
            No overlays yet. Use the <span className="font-medium text-ink">Overlay</span>{' '}
            button in the top bar to add one.
          </p>
        ) : (
          overlays.map((o) => <OverlayRow key={o.id} overlay={o} />)
        )}
      </div>
    </div>
  );
}
