'use client';

import { cn } from '@/lib/cn';
import { buildInfo } from '@/lib/buildInfo';
import { useHydrated } from '@/lib/useHydrated';

/**
 * One-line deploy identity: version · commit · build time. The timestamp is
 * formatted in the device's LOCAL time, and only after hydration — the server
 * doesn't know the client's timezone, so rendering it during SSR would
 * mismatch.
 */
export function BuildInfo({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const builtAt =
    hydrated && buildInfo.builtAt
      ? new Date(buildInfo.builtAt).toLocaleString(undefined, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  return (
    <p className={cn('mono-num text-[10px] text-muted', className)}>
      v{buildInfo.version} · {buildInfo.commit}
      {builtAt ? ` · ${builtAt}` : ''}
    </p>
  );
}
