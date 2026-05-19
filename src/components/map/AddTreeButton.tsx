'use client';

import { Button } from '@/components/ui/Button';
import { PlusIcon, CloseIcon } from '@/components/icons';
import { useCompose } from './ComposeContext';

/**
 * Top-right primary action. In idle mode: "+ Tree" starts placement.
 * In any active mode: "Cancel" exits compose flow.
 */
export function AddTreeButton() {
  const { mode, startPlacing, cancel } = useCompose();
  const active = mode !== 'idle';
  return (
    <Button
      onClick={active ? cancel : startPlacing}
      variant={active ? 'secondary' : 'primary'}
      className="rounded-full shadow-floating"
    >
      {active ? <CloseIcon size={14} /> : <PlusIcon size={14} />}
      {active ? 'Cancel' : 'Tree'}
    </Button>
  );
}
