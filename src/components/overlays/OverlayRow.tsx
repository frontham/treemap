'use client';

import { CloseIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/IconButton';
import { isLayerVisible, resolveLayerOpacity, useLayers } from '@/components/map/LayersContext';
import { trpc } from '@/lib/trpc/client';
import type { OverlayView } from '@/server/trpc/routers/overlays';

type Props = { overlay: OverlayView };

/**
 * One row in the layers panel: name · visibility toggle · opacity slider · delete.
 */
export function OverlayRow({ overlay }: Props) {
  const layers = useLayers();
  const utils = trpc.useUtils();
  const deleteOverlay = trpc.overlays.delete.useMutation({
    onSuccess: () => utils.overlays.list.invalidate(),
  });

  const visible = isLayerVisible(layers, overlay.id);
  const opacity = resolveLayerOpacity(layers, overlay.id, overlay.opacityDefault);

  return (
    <div className="flex items-center gap-3 rounded bg-paper px-2 py-1.5 hairline">
      <input
        type="checkbox"
        checked={visible}
        onChange={(e) => layers.setVisible(overlay.id, e.target.checked)}
        aria-label={`Toggle ${overlay.name}`}
        className="h-4 w-4 rounded border-hairline text-accent focus:ring-accent"
      />
      <div className="min-w-0 flex-1 truncate text-sm">{overlay.name}</div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={opacity}
        onChange={(e) => layers.setOpacity(overlay.id, Number(e.target.value))}
        aria-label={`Opacity for ${overlay.name}`}
        className="h-1 w-24 accent-accent"
      />
      <span className="mono-num w-8 text-right text-xs text-muted">
        {Math.round(opacity * 100)}%
      </span>
      <IconButton
        label={`Delete ${overlay.name}`}
        size="sm"
        onClick={() => {
          if (window.confirm(`Delete overlay "${overlay.name}"?`)) {
            deleteOverlay.mutate({ id: overlay.id });
          }
        }}
        className="text-muted hover:bg-danger/10 hover:text-danger"
      >
        <CloseIcon size={14} />
      </IconButton>
    </div>
  );
}
