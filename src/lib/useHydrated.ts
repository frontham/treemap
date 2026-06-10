'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `false` during SSR and the first client render, then `true` after
 * mount. Use it to defer rendering of client-only state (e.g. localStorage-backed
 * preferences) in components that are server-rendered, so the first client render
 * matches the server markup and there's no hydration mismatch. The real value
 * appears on the next paint.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
