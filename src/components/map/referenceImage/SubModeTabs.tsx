'use client';

export type SubMode = 'transform' | 'points';

/** Two-tab toggle between move/resize and fit-by-points. */
export function SubModeTabs({
  value,
  onChange,
}: {
  value: SubMode;
  onChange: (m: SubMode) => void;
}) {
  const tab = (m: SubMode, label: string) => (
    <button
      onClick={() => onChange(m)}
      className={`rounded px-2 py-1 text-xs ${value === m ? 'bg-panel font-medium text-ink' : 'text-muted'}`}
    >
      {label}
    </button>
  );
  return (
    <div className="mb-2 grid grid-cols-2 gap-1 rounded bg-paper p-0.5 hairline">
      {tab('transform', 'Move / resize')}
      {tab('points', 'Fit by points')}
    </div>
  );
}
