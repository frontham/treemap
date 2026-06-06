'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useRole } from '@/components/auth/useRole';
import { useAlign, type CalibrateTool } from '@/components/map/AlignContext';

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

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

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
        className={cn('rounded-full shadow-floating', (open || tool !== 'none') && 'bg-paper')}
      >
        Tools
        <ChevronDownIcon size={14} className="text-muted" />
      </Button>

      {open ? (
        <div className="absolute right-0 mt-1.5 w-56 overflow-hidden rounded-lg bg-paper hairline shadow-floating">
          <MenuButton active={tool === 'reference'} onClick={() => pick('reference')}>
            Reference image
          </MenuButton>
          {can('admin') ? (
            <>
              <div className="h-px bg-hairline" />
              <MenuButton active={tool === 'sliders'} onClick={() => pick('sliders')}>
                Calibrate (sliders)
              </MenuButton>
              <MenuButton active={tool === 'points'} onClick={() => pick('points')}>
                Align by dragging pins
              </MenuButton>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-panel',
        active && 'bg-panel font-medium',
      )}
    >
      {children}
      {active ? <span className="text-xs text-accent">on</span> : null}
    </button>
  );
}
