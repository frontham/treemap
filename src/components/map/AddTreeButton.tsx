'use client';

import { Button } from '@/components/ui/Button';
import { PlusIcon, CloseIcon } from '@/components/icons';
import { useCompose } from './ComposeContext';
import { useT } from '@/lib/i18n/LocaleProvider';

/**
 * Top-right primary action. In idle mode: "+ Tree" starts placement.
 * In any active mode: "Cancel" exits compose flow.
 */
export function AddTreeButton() {
  const { mode, startPlacing, cancel } = useCompose();
  const t = useT();
  const active = mode !== 'idle';
  return (
    <Button
      onClick={active ? cancel : startPlacing}
      variant={active ? 'secondary' : 'primary'}
      className="rounded-full shadow-floating"
    >
      {active ? <CloseIcon size={14} /> : <PlusIcon size={14} />}
      {/* Icon-only on mobile; label from sm up. */}
      <span className="hidden sm:inline">{active ? t('common.cancel') : t('addTree.tree')}</span>
    </Button>
  );
}
