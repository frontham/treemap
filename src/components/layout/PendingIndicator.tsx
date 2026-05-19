'use client';

import { useEffect, useState } from 'react';
import { onQueueChanged, queueSize } from '@/lib/offline/queue';

/**
 * Small badge that surfaces the number of mutations waiting to sync.
 * Hidden when the queue is empty so it doesn't add chrome in the happy path.
 */
export function PendingIndicator() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(queueSize());
    return onQueueChanged(() => setCount(queueSize()));
  }, []);

  if (count === 0) return null;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-warn shadow-floating">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warn" aria-hidden />
      <span className="mono-num text-xs font-medium">{count} pending</span>
    </div>
  );
}
