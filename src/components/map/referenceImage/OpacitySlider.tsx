'use client';

import { useT } from '@/lib/i18n/LocaleProvider';

/** Labelled 0–100% opacity slider for the dropped image. */
export function OpacitySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const t = useT();
  return (
    <label className="mb-2 block">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{t('refimg.opacity')}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full accent-accent"
      />
    </label>
  );
}
