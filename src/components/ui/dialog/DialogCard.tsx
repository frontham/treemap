'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { useT } from '@/lib/i18n/LocaleProvider';

type Props = {
  kind: 'confirm' | 'prompt';
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  defaultValue?: string;
  /** Confirm: true / false. Prompt: the entered string / null. Cancel/Esc/backdrop settle falsy. */
  onSettle: (value: boolean | string | null) => void;
};

/**
 * The compact modal card behind useDialog().confirm/prompt. Esc and backdrop
 * cancel; Enter submits the prompt. Portalled to <body> so a transformed
 * ancestor can't trap the fixed overlay.
 */
export function DialogCard({ kind, message, confirmLabel, danger, defaultValue, onSettle }: Props) {
  const t = useT();
  const [value, setValue] = useState(defaultValue ?? '');

  const cancel = () => onSettle(kind === 'prompt' ? null : false);
  const submit = () => onSettle(kind === 'prompt' ? value : true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div
        role={kind === 'confirm' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        className="w-full max-w-sm rounded-xl bg-paper p-4 shadow-floating hairline"
      >
        <p className="text-sm text-ink">{message}</p>
        {kind === 'prompt' ? (
          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              autoFocus
              className={inputBase}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </form>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={cancel}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" variant={danger ? 'danger' : 'primary'} onClick={submit}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
