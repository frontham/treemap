'use client';

import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n/LocaleProvider';
import { renderTokens } from '@/lib/i18n/renderTokens';

type Props = {
  /** Editing a saved overlay (Update/Cancel) vs. a fresh image (Save/Remove). */
  editing: boolean;
  pending: boolean;
  onCommit: () => void;
  onReplace: () => void;
  onDiscard: () => void;
};

/** Move/resize mode: the handle legend + save/update actions. */
export function TransformActions({ editing, pending, onCommit, onReplace, onDiscard }: Props) {
  const t = useT();
  const commitLabel = editing
    ? pending
      ? t('refimg.updating')
      : t('refimg.update')
    : pending
      ? t('common.saving')
      : t('refimg.save');
  return (
    <>
      <p className="mb-2 text-xs text-muted">
        {renderTokens(t('refimg.dragHint'), {
          blue: <span className="font-medium text-[#2563eb]">{t('refimg.blue')}</span>,
          green: <span className="font-medium text-[#16a34a]">{t('refimg.green')}</span>,
          purple: <span className="font-medium text-[#9333ea]">{t('refimg.purple')}</span>,
        })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onCommit} disabled={pending}>
          {commitLabel}
        </Button>
        <Button size="sm" variant="secondary" onClick={onReplace}>
          {t('refimg.replace')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          {editing ? t('common.cancel') : t('refimg.remove')}
        </Button>
      </div>
    </>
  );
}
