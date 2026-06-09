'use client';

import { TreeFilterControl } from '@/components/map/TreeFilterControl';

/**
 * Floating card hosting the attribute filters. Anchored above the floating
 * control cluster (same spot as the Layers card); shown/hidden by the cluster.
 */
export function FiltersPanel() {
  return (
    <div className="pointer-events-auto absolute bottom-16 right-3 z-30 w-80 max-h-[70vh] overflow-y-auto rounded-lg bg-panel/95 p-3 backdrop-blur-md hairline shadow-floating">
      <TreeFilterControl />
    </div>
  );
}
