import type { ReactNode } from 'react';

/** Numbered, ruled section header — the dossier backbone of the sheet. */
export function SectionTitle({ no, children }: { no: string; children: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-baseline gap-3 border-b border-ink pb-1.5">
      <span className="mono-num text-xs text-muted">{no}</span>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">{children}</h2>
    </div>
  );
}
