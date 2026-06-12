'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DialogCard } from './DialogCard';

export type ConfirmOptions = {
  message: string;
  /** Defaults to t('common.confirm'). */
  confirmLabel?: string;
  /** Style the confirm button as destructive. */
  danger?: boolean;
};

export type PromptOptions = ConfirmOptions & {
  defaultValue?: string;
};

type DialogApi = {
  /** Promise-based replacement for window.confirm. Resolves false on cancel/Esc. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Promise-based replacement for window.prompt. Resolves null on cancel/Esc. */
  prompt: (opts: PromptOptions) => Promise<string | null>;
};

type Pending =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: 'prompt'; opts: PromptOptions; resolve: (value: string | null) => void };

const DialogContext = createContext<DialogApi>({
  confirm: () => Promise.resolve(false),
  prompt: () => Promise.resolve(null),
});

/** App-wide confirm/prompt dialogs. Mounted once in the root layout. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const api = useMemo<DialogApi>(
    () => ({
      confirm: (opts) =>
        new Promise<boolean>((resolve) => setPending({ kind: 'confirm', opts, resolve })),
      prompt: (opts) =>
        new Promise<string | null>((resolve) => setPending({ kind: 'prompt', opts, resolve })),
    }),
    [],
  );

  const settle = (value: boolean | string | null) => {
    if (!pending) return;
    if (pending.kind === 'confirm') pending.resolve(value === true);
    else pending.resolve(typeof value === 'string' ? value : null);
    setPending(null);
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      {pending ? (
        <DialogCard
          kind={pending.kind}
          message={pending.opts.message}
          confirmLabel={pending.opts.confirmLabel}
          danger={pending.opts.danger}
          defaultValue={pending.kind === 'prompt' ? pending.opts.defaultValue : undefined}
          onSettle={settle}
        />
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  return useContext(DialogContext);
}
