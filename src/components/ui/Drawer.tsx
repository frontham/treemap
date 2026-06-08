'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind width class. Defaults to full-width on phones, a 420px panel from sm up. */
  width?: string;
};

/**
 * Right-anchored sliding drawer. Slides off-screen when closed; closes on Esc.
 * Stays mounted so child state survives close/reopen — uses translate-x for the
 * animation rather than conditional rendering.
 */
export function Drawer({ open, onClose, children, width = 'w-full sm:w-[420px]' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <aside
      role="dialog"
      aria-hidden={!open}
      className={cn(
        'pointer-events-auto absolute right-0 top-0 z-30 h-full',
        'bg-paper border-l border-hairline shadow-floating',
        'transition-transform duration-med ease-out-expo',
        width,
        open ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {children}
    </aside>
  );
}
