'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = { open: boolean; onClose: () => void; children: ReactNode };

/**
 * Centered full-screen-ish modal with backdrop. Closes on Esc / backdrop click.
 * Doesn't render anything when closed (vs. Drawer, which stays mounted).
 *
 * Rendered through a portal to document.body so its `fixed inset-0` is relative
 * to the viewport — otherwise a transformed ancestor (e.g. the slide-in Drawer,
 * which uses translate-x) becomes the containing block and traps the overlay.
 */
export function Modal({ open, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="h-full max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-paper shadow-floating">
        {children}
      </div>
    </div>,
    document.body,
  );
}
