'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls `onOutside` on any mousedown outside `ref`. Pass `enabled` (usually the
 * menu's open state) so the listener only exists while something is open.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean,
) {
  // Keep the latest callback without re-subscribing the listener on each render.
  const cb = useRef(onOutside);
  cb.current = onOutside;

  useEffect(() => {
    if (!enabled) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) cb.current();
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [ref, enabled]);
}
