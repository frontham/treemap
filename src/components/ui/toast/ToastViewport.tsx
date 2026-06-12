'use client';

import { cn } from '@/lib/cn';
import type { Toast } from './ToastProvider';

/** Bottom-centered stack of notices; click a notice to dismiss it early. */
export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          role={t.kind === 'error' ? 'alert' : 'status'}
          onClick={() => onDismiss(t.id)}
          className={cn(
            'pointer-events-auto max-w-md rounded-lg px-3.5 py-2.5 text-left text-sm shadow-floating hairline backdrop-blur-md',
            t.kind === 'error' ? 'bg-panel/95 text-danger' : 'bg-panel/95 text-ink',
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
