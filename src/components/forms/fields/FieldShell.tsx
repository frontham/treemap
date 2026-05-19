import type { ReactNode } from 'react';

type Props = { label: string; children: ReactNode };

/** Shared label + slot wrapper used by every form field primitive. */
export function FieldShell({ label, children }: Props) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputBase =
  'h-9 rounded bg-paper hairline px-2.5 text-sm placeholder:text-muted ' +
  'focus:outline-none focus:ring-1 focus:ring-accent';
