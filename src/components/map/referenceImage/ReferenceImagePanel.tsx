'use client';

import type { ReactNode } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';

/** Floating panel chrome for the reference-image tool (bottom-left, above the map). */
export function ReferenceImagePanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className="absolute bottom-4 left-4 z-30 w-72 rounded-lg bg-panel/95 p-3 text-ink shadow-floating hairline backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="truncate pr-2 text-sm font-medium">{title}</span>
        <button
          onClick={onClose}
          className="shrink-0 text-muted hover:text-ink"
          aria-label={t('common.close')}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}
