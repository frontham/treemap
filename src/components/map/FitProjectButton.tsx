'use client';

import { IconButton } from '@/components/ui/IconButton';
import { FitIcon } from '@/components/icons';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useMap } from './MapContext';
import { fitToTrees } from './fitToTrees';

/** Recenter/zoom the map to fit all of the project's trees. */
export function FitProjectButton({ onActivate }: { onActivate?: () => void }) {
  const { map } = useMap();
  const t = useT();
  const { data } = trpc.trees.list.useQuery();
  const features = data?.features ?? [];

  return (
    <IconButton
      label={t('controls.fitProject')}
      onClick={() => {
        onActivate?.();
        if (map) fitToTrees(map, features);
      }}
      disabled={!map || features.length === 0}
      className="rounded-full text-ink"
    >
      <FitIcon size={16} />
    </IconButton>
  );
}
