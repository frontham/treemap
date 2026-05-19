import { vanillaTrpc } from '@/lib/trpc/vanillaClient';
import { listQueue, removeFromQueue, type PendingOp } from './queue';

export type DrainResult = { synced: number; failed: number };

/**
 * Walks the pending-mutations queue in order. On the first failure, stops
 * (probably still offline — try again later). On success, removes the entry.
 */
export async function drainQueue(): Promise<DrainResult> {
  const queue = listQueue();
  let synced = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      await runOp(op);
      removeFromQueue(op.id);
      synced++;
    } catch {
      failed++;
      break;
    }
  }

  return { synced, failed };
}

async function runOp(op: PendingOp): Promise<void> {
  switch (op.kind) {
    case 'trees.create':
      await vanillaTrpc.trees.create.mutate(op.payload as never);
      return;
    default:
      // Unknown op — drop silently rather than blocking the queue.
      return;
  }
}
