'use client';

import { useEffect, type ReactNode } from 'react';

type Props = { open: boolean; onClose: () => void; children: ReactNode };

/**
 * Centered full-screen-ish modal with backdrop. Closes on Esc / backdrop click.
 * Doesn't render anything when closed (vs. Drawer, which stays mounted).
 */
export function Modal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-full max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-paper shadow-floating">
        {children}
      </div>
    </div>
  );
}
