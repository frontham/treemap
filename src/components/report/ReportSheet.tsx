'use client';

import { useLocale, useT } from '@/lib/i18n/LocaleProvider';
import { useDateFormatter } from '@/lib/i18n/useDateFormatter';
import type { TreeView } from '@/components/trees/TreeView';
import type { InspectionView } from '@/server/trpc/routers/inspections';
import type { BasemapId } from '@/components/map/basemaps';
import { ReportMasthead } from './ReportMasthead';
import { LocationSection } from './LocationSection';
import { DetailsSection } from './DetailsSection';
import { InspectionsSection } from './InspectionsSection';
import { PhotosSection } from './PhotosSection';
import type { PrintPhoto } from './useTreeReportData';

type Props = {
  tree: TreeView;
  projectName: string;
  basemapId: BasemapId;
  attribution: string;
  /** Inspections picked for printing. */
  inspections: InspectionView[];
  /** Whether the tree has any inspections at all (controls the empty note). */
  hasAnyInspections: boolean;
  photos: PrintPhoto[];
  labelFor: (key: string) => string;
};

/**
 * The printed A4 sheet itself: masthead, numbered sections (location, details,
 * inspections, photos) and the colophon. Purely presentational — what to print
 * is decided by the config rail and passed in.
 */
export function ReportSheet({
  tree,
  projectName,
  basemapId,
  attribution,
  inspections,
  hasAnyInspections,
  photos,
  labelFor,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const fmtDate = useDateFormatter();
  const yearsUnit = locale === 'nl' ? 'jr' : 'yrs';

  // Sections number themselves in render order, skipping the hidden ones.
  let sectionCount = 0;
  const sectionNo = () => String(++sectionCount).padStart(2, '0');

  return (
    <article className="report-sheet mx-auto">
      <ReportMasthead tree={tree} projectName={projectName} />

      <LocationSection
        no={sectionNo()}
        location={tree.location}
        basemapId={basemapId}
        attribution={attribution}
      />

      <DetailsSection no={sectionNo()} tree={tree} labelFor={labelFor} yearsUnit={yearsUnit} />

      {inspections.length > 0 || !hasAnyInspections ? (
        <InspectionsSection
          no={sectionNo()}
          inspections={inspections}
          hasAny={hasAnyInspections}
          labelFor={labelFor}
          yearsUnit={yearsUnit}
        />
      ) : null}

      {photos.length > 0 ? <PhotosSection no={sectionNo()} photos={photos} /> : null}

      <footer className="mt-10 flex items-baseline justify-between gap-4 border-t border-ink pt-2 text-[10px] text-muted">
        <span>{t('report.generated', { date: fmtDate(new Date()) ?? '' })}</span>
        <span className="mono-num">{tree.id}</span>
      </footer>
    </article>
  );
}
