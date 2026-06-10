'use client';

import { useRef, useState } from 'react';
import { PlusIcon, TrashIcon, CloseIcon } from '@/components/icons';
import { Spinner } from '@/components/ui/Spinner';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import { processImage } from '@/lib/image/processImage';
import type { TreePhotoView } from './TreeView';

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
 * client-side and stored as JPEG data URLs (see processImage / trees.addPhoto).
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
  const [busy, setBusy] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const addPhoto = trpc.trees.addPhoto.useMutation();
  const deletePhoto = trpc.trees.deletePhoto.useMutation({
    onSuccess: onChanged,
    onError: (e) => window.alert(`${t('photos.uploadFailed')}: ${e.message}`),
  });

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      // Process + upload sequentially so a large batch doesn't spike memory.
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const img = await processImage(file);
        await addPhoto.mutateAsync({
          treeId,
          inspectionId,
          storageKey: img.full,
          thumbnailKey: img.thumb,
          mimeType: 'image/jpeg',
          sizeBytes: img.bytes,
          width: img.width,
          height: img.height,
        });
      }
      onChanged();
    } catch (e) {
      window.alert(`${t('photos.uploadFailed')}: ${e instanceof Error ? e.message : ''}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

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
          <Thumb
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
              onChange={(e) => onFiles(e.target.files)}
            />
          </>
        ) : null}

        {!compact && photos.length === 0 && !canEdit ? (
          <p className="text-sm text-muted">{t('photos.empty')}</p>
        ) : null}
      </div>

      <Lightbox photoId={lightboxId} onClose={() => setLightboxId(null)} />
    </section>
  );
}

function Thumb({
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

/** Loads the full-size image on demand when a thumbnail is opened. */
function Lightbox({ photoId, onClose }: { photoId: string | null; onClose: () => void }) {
  const t = useT();
  const { data, isLoading } = trpc.trees.photo.useQuery(
    { id: photoId ?? '' },
    { enabled: !!photoId },
  );

  return (
    <Modal open={!!photoId} onClose={onClose}>
      <div className="relative flex h-full w-full items-center justify-center bg-ink">
        <IconButton
          label={t('common.close')}
          onClick={onClose}
          className="absolute right-2 top-2 z-10 bg-ink/50 text-white hover:bg-ink/70"
        >
          <CloseIcon size={18} />
        </IconButton>
        {isLoading || !data ? (
          <Spinner size={28} className="text-white" />
        ) : (
          <figure className="flex h-full w-full flex-col items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.url}
              alt={data.caption ?? ''}
              className="max-h-full max-w-full object-contain"
            />
            {data.caption ? (
              <figcaption className="mt-3 text-center text-sm text-white/80">
                {data.caption}
              </figcaption>
            ) : null}
          </figure>
        )}
      </div>
    </Modal>
  );
}
