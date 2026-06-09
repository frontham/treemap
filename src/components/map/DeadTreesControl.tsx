'use client';

import { DEAD_TREE_MODES, useDeadTrees } from './DeadTreesContext';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';

/**
 * Segmented Show / Dim / Hide control for dead trees. Shared by the desktop
 * Layers panel and the mobile layers sheet; reads/writes the DeadTrees context.
 */
export function DeadTreesControl() {
  const t = useT();
  const { mode, setMode } = useDeadTrees();

  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{t('deadTrees.label')}</p>
      <div
        role="group"
        aria-label={t('deadTrees.label')}
        className="grid grid-cols-3 gap-1 rounded bg-panel p-0.5 hairline"
      >
        {DEAD_TREE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={cn(
              'rounded px-2 py-1 text-xs transition-colors',
              mode === m ? 'bg-paper font-medium text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {t(`deadTrees.${m}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
