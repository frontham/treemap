'use client';

import { useCompose } from './ComposeContext';

/**
 * Thin instruction banner that appears below the top bar while the user is in
 * 'placing' mode. Quiet ink-on-paper style; Esc shortcut surfaced in mono.
 */
export function ComposeBanner() {
  const { mode } = useCompose();
  if (mode !== 'placing') return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center">
      <div className="rounded-full bg-ink/90 px-3.5 py-1.5 text-xs text-paper shadow-floating">
        Tap the map to place a tree · <span className="mono-num">Esc</span> to cancel
      </div>
    </div>
  );
}
