'use client';

import { Modal } from '@/components/ui/Modal';
import { IconButton } from '@/components/ui/IconButton';
import { Spinner } from '@/components/ui/Spinner';
import { CloseIcon } from '@/components/icons';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';

/** Full-screen photo viewer; loads the full-size image on demand when opened. */
export function PhotoLightbox({
  photoId,
  onClose,
}: {
  photoId: string | null;
  onClose: () => void;
}) {
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
