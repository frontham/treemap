'use client';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { cn } from '@/lib/cn';

/**
 * Thin top progress bar that animates whenever any React Query request or
 * mutation is in flight — a single, always-visible "something is happening"
 * signal across the whole app. Must live inside the QueryClientProvider.
 */
export function GlobalActivityBar() {
  const active = useIsFetching() + useIsMutating() > 0;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden',
        'transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className="h-full w-full bg-accent"
        style={{ animation: active ? 'tm-progress 1.1s ease-in-out infinite' : 'none' }}
      />
    </div>
  );
}
