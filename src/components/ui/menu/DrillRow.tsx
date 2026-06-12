'use client';

/** Full-width row that drills into a sub-view; shows the current value + chevron. */
export function DrillRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-panel"
    >
      {label}
      <span className="flex min-w-0 items-center gap-1 text-muted">
        <span className="min-w-0 truncate text-xs">{value}</span>
        <span>›</span>
      </span>
    </button>
  );
}
