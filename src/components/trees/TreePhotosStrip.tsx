'use client';

import { useRef, useState } from 'react';
import { PlusIcon } from '@/components/icons';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { TreePhotoView } from './TreeView';
import { PhotoThumb } from './PhotoThumb';
import { PhotoLightbox } from './PhotoLightbox';
import { usePhotoUpload } from './usePhotoUpload';

type Props = {
  treeId: string;
  photos: TreePhotoView[];
  canEdit: boolean;
  /** Called after a successful add/delete so the parent invalidates its query. */
  onChanged: () => void;
  /** When set, uploaded photos attach to this inspection rather than the tree. */
  inspectionId?: string;
  /** Tighter layout (no section header, smaller tiles, hidden when empty + read-only). */
  compact?: boolean;
  /**
   * Section header. Omit for the default ("Photos", non-compact only); pass a
   * string to label the group (e.g. "Latest inspection · 12 Mar 2026"); pass
   * null for no header.
   */
  title?: string | null;
};

/**
 * Photo strip: thumbnails (click → lightbox) plus, for editors, an upload tile
 * and per-photo delete. Used both for general tree photos (Details tab) and as
 * evidence under an inspection (compact + inspectionId). Images are downscaled
 * client-side and stored as JPEG data URLs (see usePhotoUpload / trees.addPhoto).
 */
export function TreePhotosStrip({
  treeId,
  photos,
  canEdit,
  onChanged,
  inspectionId,
  compact = false,
  title,
}: Props) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const { busy, uploadFiles } = usePhotoUpload({ treeId, inspectionId, onChanged });
  const deletePhoto = trpc.trees.deletePhoto.useMutation({
    onSuccess: onChanged,
    onError: (e) => window.alert(`${t('photos.uploadFailed')}: ${e.message}`),
  });

  function onDelete(id: string) {
    if (window.confirm(t('photos.deleteConfirm'))) deletePhoto.mutate({ id });
  }

  // In compact mode (inspection cards), stay invisible when there's nothing to
  // show and nothing the user can do — keeps the inspection list uncluttered.
  if (compact && !canEdit && photos.length === 0) return null;

  const tile = compact ? 'h-14 w-14' : 'h-16 w-16';

  // Header: explicit title wins; otherwise default to "Photos" (non-compact only).
  const header = title !== undefined ? title : compact ? null : t('photos.title');

  return (
    <section className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {header ? (
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">{header}</h3>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <PhotoThumb
            key={p.id}
            url={p.thumbnailUrl}
            caption={p.caption}
            sizeClass={tile}
            onOpen={() => setLightboxId(p.id)}
            onDelete={canEdit ? () => onDelete(p.id) : undefined}
            deleteLabel={t('photos.delete')}
            deleting={deletePhoto.isPending && deletePhoto.variables?.id === p.id}
          />
        ))}

        {canEdit ? (
          <>
            <button
              type="button"
              aria-label={t('photos.add')}
              title={t('photos.add')}
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'flex items-center justify-center rounded bg-panel hairline text-muted',
                'transition-colors hover:bg-paper disabled:opacity-50',
                tile,
              )}
            >
              {busy ? <Spinner size={16} /> : <PlusIcon size={16} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                void uploadFiles(files);
              }}
            />
          </>
        ) : null}

        {!compact && photos.length === 0 && !canEdit ? (
          <p className="text-sm text-muted">{t('photos.empty')}</p>
        ) : null}
      </div>

      <PhotoLightbox photoId={lightboxId} onClose={() => setLightboxId(null)} />
    </section>
  );
}
