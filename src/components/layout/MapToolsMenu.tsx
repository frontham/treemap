'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ActionRow, Divider } from '@/components/ui/menu';
import { ChevronDownIcon, ToolsIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useRole } from '@/components/auth/useRole';
import { useAlign, type CalibrateTool } from '@/components/map/AlignContext';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useClickOutside } from '@/lib/useClickOutside';

/**
 * Top-bar dropdown that opens the map alignment tools (one at a time):
 *   - Reference image  (drop a screenshot, drag/resize, optionally save)
 *   - Calibrate sliders / Align by dragging  (admin — move the whole tree set)
 * Each tool renders its own floating panel keyed off the shared AlignContext.
 */
export function MapToolsMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { can } = useRole();
  const { tool, setTool } = useAlign();
  const t = useT();

  useClickOutside(rootRef, () => setOpen(false), open);

  if (!can('editor')) return null;

  const pick = (t: CalibrateTool) => {
    setTool(tool === t ? 'none' : t);
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('tools.menu')}
        className={cn('rounded-full shadow-floating', (open || tool !== 'none') && 'bg-paper')}
      >
        {/* Icon-only on mobile; "Tools ▾" from sm up. */}
        <ToolsIcon size={16} className="sm:hidden" />
        <span className="hidden sm:inline">{t('tools.menu')}</span>
        <ChevronDownIcon size={14} className="hidden text-muted sm:inline" />
      </Button>

      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 w-56 overflow-hidden rounded-lg bg-paper hairline shadow-floating">
          <ActionRow
            active={tool === 'reference'}
            onClick={() => pick('reference')}
            label={t('tools.reference')}
          />
          {can('admin') ? (
            <>
              <Divider />
              <ActionRow
                active={tool === 'sliders'}
                onClick={() => pick('sliders')}
                label={t('tools.calibrate')}
              />
              <ActionRow
                active={tool === 'points'}
                onClick={() => pick('points')}
                label={t('tools.alignDrag')}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
