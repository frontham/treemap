'use client';

import { Button } from '@/components/ui/Button';

type Props = {
  pairCount: number;
  hasPending: boolean;
  onFit: () => void;
  onClear: () => void;
};

/** Fit-by-points mode: instructions + the Fit / Clear actions. */
export function FitActions({ pairCount, hasPending, onFit, onClear }: Props) {
  return (
    <>
      <p className="mb-2 text-xs text-muted">
        Click a feature on the <span className="font-medium text-[#f59e0b]">image</span>, then the
        same spot on the <span className="font-medium text-[#16a34a]">map</span>. Repeat 2–3×
        across the area, then Fit.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onFit} disabled={pairCount < 2}>
          Fit ({pairCount})
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={pairCount === 0 && !hasPending}>
          Clear points
        </Button>
      </div>
    </>
  );
}
