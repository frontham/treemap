'use client';

import { cn } from '@/lib/cn';

/** Full-width action; optionally shows an "on" marker when its tool/state is active. */
export function ActionRow({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-panel',
        active && 'bg-panel font-medium',
      )}
    >
      {label}
      {active ? <span className="text-xs text-accent">on</span> : null}
    </button>
  );
}
