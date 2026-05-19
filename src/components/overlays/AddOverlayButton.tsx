'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LayersIcon } from '@/components/icons';
import { OverlayEditor } from './OverlayEditor';

/**
 * Pill button that opens the overlay corner-picker modal.
 * Lives in the floating top-bar next to the "+ Tree" action.
 */
export function AddOverlayButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="rounded-full shadow-floating"
      >
        <LayersIcon size={14} />
        Overlay
      </Button>
      <OverlayEditor open={open} onClose={() => setOpen(false)} />
    </>
  );
}
