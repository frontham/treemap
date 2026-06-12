'use client';

import { Button } from '@/components/ui/Button';

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
  const commitLabel = editing
    ? pending
      ? 'Updating…'
      : 'Update overlay'
    : pending
      ? 'Saving…'
      : 'Save overlay';
  return (
    <>
      <p className="mb-2 text-xs text-muted">
        Drag <span className="font-medium text-[#2563eb]">blue</span> to move,{' '}
        <span className="font-medium text-[#16a34a]">green</span> to resize,{' '}
        <span className="font-medium text-[#9333ea]">purple</span> to rotate.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onCommit} disabled={pending}>
          {commitLabel}
        </Button>
        <Button size="sm" variant="secondary" onClick={onReplace}>
          Replace
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          {editing ? 'Cancel' : 'Remove'}
        </Button>
      </div>
    </>
  );
}
