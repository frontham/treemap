import { readQueue, writeQueue } from './storage';

export type PendingOp = {
  id: string;
  kind: 'trees.create';
  payload: unknown;
  queuedAt: number;
};

const QUEUE_CHANGED_EVENT = 'treemap:queue-changed';

export function enqueue(op: Omit<PendingOp, 'id' | 'queuedAt'>): PendingOp {
  const entry: PendingOp = {
    ...op,
    id: crypto.randomUUID(),
    queuedAt: Date.now(),
  };
  const queue = readQueue<PendingOp>();
  writeQueue([...queue, entry]);
  notifyChanged();
  return entry;
}

export function listQueue(): PendingOp[] {
  return readQueue<PendingOp>();
}

export function removeFromQueue(id: string): void {
  const queue = readQueue<PendingOp>();
  writeQueue(queue.filter((op) => op.id !== id));
  notifyChanged();
}

export function queueSize(): number {
  return readQueue<PendingOp>().length;
}

export function onQueueChanged(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(QUEUE_CHANGED_EVENT, handler);
  return () => window.removeEventListener(QUEUE_CHANGED_EVENT, handler);
}

function notifyChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
}
