import type { ReactNode } from 'react';

/** Small uppercase group label inside a menu sheet. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted">
      {children}
    </div>
  );
}
