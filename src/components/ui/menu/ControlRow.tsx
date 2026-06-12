import type { ReactNode } from 'react';

/** A row whose right side hosts a self-contained control (e.g. the location toggle). */
export function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-sm text-ink">{label}</span>
      {children}
    </div>
  );
}
