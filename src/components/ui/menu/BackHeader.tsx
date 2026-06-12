'use client';

/** Sub-view header with a back affordance, returning to the root list. */
export function BackHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex w-full items-center gap-1.5 border-b border-hairline px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-panel"
    >
      <span className="text-muted">‹</span>
      {label}
    </button>
  );
}
