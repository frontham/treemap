'use client';

import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n/LocaleProvider';
import { renderTokens } from '@/lib/i18n/renderTokens';

type Props = {
  pairCount: number;
  hasPending: boolean;
  onFit: () => void;
  onClear: () => void;
};

/** Fit-by-points mode: instructions + the Fit / Clear actions. */
export function FitActions({ pairCount, hasPending, onFit, onClear }: Props) {
  const t = useT();
  return (
    <>
      <p className="mb-2 text-xs text-muted">
        {renderTokens(t('refimg.fitHint'), {
          image: <span className="font-medium text-[#f59e0b]">{t('refimg.image')}</span>,
          map: <span className="font-medium text-[#16a34a]">{t('refimg.map')}</span>,
        })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onFit} disabled={pairCount < 2}>
          {t('refimg.fit', { count: pairCount })}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={pairCount === 0 && !hasPending}>
          {t('refimg.clearPoints')}
        </Button>
      </div>
    </>
  );
}
