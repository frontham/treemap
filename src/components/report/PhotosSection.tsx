'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { trpc } from '@/lib/trpc/client';
import { SectionTitle } from './SectionTitle';
import type { PrintPhoto } from './useTreeReportData';

/**
 * The selected photos in a two-column grid. Thumbnails are capped at 400px —
 * the full-size rendition of each photo is fetched here so the printed page
 * stays sharp (falling back to the thumbnail while it loads).
 */
export function PhotosSection({ no, photos }: { no: string; photos: PrintPhoto[] }) {
  const t = useT();
  const fullPhotoQs = trpc.useQueries((q) => photos.map((p) => q.trees.photo({ id: p.id })));

  return (
    <section>
      <SectionTitle no={no}>{t('report.sectionPhotos')}</SectionTitle>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {photos.map((p, idx) => (
          <figure key={p.id} className="report-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fullPhotoQs[idx]?.data?.url ?? p.thumbnailUrl}
              alt={p.caption ?? ''}
              className="max-h-[110mm] w-full rounded-sm border border-hairline object-cover"
            />
            <figcaption className="mt-1 flex items-baseline justify-between gap-3 text-xs text-muted">
              <span className="min-w-0">{p.caption ?? ''}</span>
              <span className="shrink-0">{p.groupLabel}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
