import { vanillaTrpc } from '@/lib/trpc/vanillaClient';
import { listQueue, removeFromQueue, type PendingOp } from './queue';

export type DrainResult = { synced: number; failed: number; skipped: number };

/**
 * Walks the pending-mutations queue in order. Ops scoped to a project other
 * than the currently active one are skipped (they drain when the user returns
 * to that project — the server pins writes to the cookie-active project). On
 * the first failure, stops (probably still offline — try again later). On
 * success, removes the entry.
 */
export async function drainQueue(): Promise<DrainResult> {
  const queue = listQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, skipped: 0 };

  // Resolve the active project once per drain; if even this fails we're
  // offline and everything stays queued.
  let activeProjectId: string | null;
  try {
    const me = await vanillaTrpc.auth.me.query();
    activeProjectId = me.project?.id ?? null;
  } catch {
    return { synced: 0, failed: queue.length, skipped: 0 };
  }

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const op of queue) {
    if (op.projectId && op.projectId !== activeProjectId) {
      skipped++;
      continue;
    }
    try {
      await runOp(op);
      removeFromQueue(op.id);
      synced++;
    } catch {
      failed++;
      break;
    }
  }

  return { synced, failed, skipped };
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
