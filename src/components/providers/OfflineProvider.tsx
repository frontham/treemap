'use client';

import { useEffect, type ReactNode } from 'react';
import { trpc } from '@/lib/trpc/client';
import { drainQueue } from '@/lib/offline/sync';
import { onQueueChanged } from '@/lib/offline/queue';

const POLL_MS = 30_000;

/**
 * Periodically (and on 'online' or any enqueue) drains the offline queue.
 * On any successful sync, invalidates the trees list so synced pins appear
 * on the map.
 */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();

  useEffect(() => {
    let cancelled = false;

    const tryDrain = async () => {
      if (cancelled) return;
      const r = await drainQueue();
      if (r.synced > 0) utils.trees.list.invalidate();
    };

    tryDrain();
    const interval = setInterval(tryDrain, POLL_MS);
    const onOnline = () => tryDrain();
    window.addEventListener('online', onOnline);
    const offQueue = onQueueChanged(tryDrain);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      offQueue();
    };
  }, [utils]);

  return <>{children}</>;
}
