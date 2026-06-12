'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { processImage } from '@/lib/image/processImage';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useToast } from '@/components/ui/toast/ToastProvider';

type Args = {
  treeId: string;
  /** When set, uploaded photos attach to this inspection rather than the tree. */
  inspectionId?: string;
  /** Called once after a successful batch so the caller invalidates its query. */
  onChanged: () => void;
};

/**
 * Downscale-and-upload pipeline for tree photos. Files are processed + uploaded
 * sequentially so a large batch doesn't spike memory.
 */
export function usePhotoUpload({ treeId, inspectionId, onChanged }: Args) {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const addPhoto = trpc.trees.addPhoto.useMutation();

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) {
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
      toast.error(`${t('photos.uploadFailed')}: ${e instanceof Error ? e.message : ''}`);
    } finally {
      setBusy(false);
    }
  }

  return { busy, uploadFiles };
}
