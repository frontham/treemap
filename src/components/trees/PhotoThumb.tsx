'use client';

import { Spinner } from '@/components/ui/Spinner';
import { TrashIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

/** A photo tile: click opens the lightbox; editors get a hover delete button. */
export function PhotoThumb({
  url,
  caption,
  sizeClass,
  onOpen,
  onDelete,
  deleteLabel,
  deleting,
}: {
  url?: string;
  caption?: string;
  sizeClass: string;
  onOpen: () => void;
  onDelete?: () => void;
  deleteLabel: string;
  deleting: boolean;
}) {
  return (
    <div className={cn('group relative overflow-hidden rounded bg-panel hairline', sizeClass)}>
      <button type="button" onClick={onOpen} className="block h-full w-full">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={caption ?? ''} className="h-full w-full object-cover" />
        ) : null}
      </button>
      {onDelete ? (
        <button
          type="button"
          aria-label={deleteLabel}
          title={deleteLabel}
          onClick={onDelete}
          disabled={deleting}
          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded bg-ink/60 text-white opacity-0 transition-opacity hover:bg-danger focus:opacity-100 group-hover:opacity-100"
        >
          {deleting ? <Spinner size={12} /> : <TrashIcon size={12} />}
        </button>
      ) : null}
    </div>
  );
}
