'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import { PrinterIcon } from '@/components/icons';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { BasemapId } from '@/components/map/basemaps';
import type { InspectionView } from '@/server/trpc/routers/inspections';
import type { SelectionSet } from '@/lib/useSelectionSet';
import { BasemapPicker } from './BasemapPicker';
import { InspectionPicker } from './InspectionPicker';
import { PhotoGroupPicker } from './PhotoGroupPicker';
import type { PhotoGroup } from './useTreeReportData';

type Props = {
  orgSlug: string;
  projectSlug: string;
  projectName: string;
  basemapOptions: BasemapId[];
  basemapId: BasemapId;
  onSelectBasemap: (id: BasemapId) => void;
  inspections: InspectionView[];
  inspectionSelection: SelectionSet;
  photoGroups: PhotoGroup[];
  photoSelection: SelectionSet;
};

/** The screen-only left rail: back link, print button, and what-goes-in pickers. */
export function ReportConfigRail({
  orgSlug,
  projectSlug,
  projectName,
  basemapOptions,
  basemapId,
  onSelectBasemap,
  inspections,
  inspectionSelection,
  photoGroups,
  photoSelection,
}: Props) {
  const t = useT();
  return (
    <aside className="sticky top-8 w-72 shrink-0 print:hidden">
      <Link
        href={`/orgs/${orgSlug}/projects/${projectSlug}/map` as Route}
        className="text-sm text-accent hover:underline"
      >
        ← {projectName}
      </Link>
      <h1 className="mt-2 text-xl font-semibold tracking-tight">{t('report.title')}</h1>

      <Button onClick={() => window.print()} className="mt-4 w-full">
        <PrinterIcon size={16} />
        {t('report.print')}
      </Button>
      <p className="mt-2 text-xs text-muted">{t('report.printHint')}</p>

      <div className="mt-6 flex flex-col gap-6 border-t border-hairline pt-5">
        <BasemapPicker options={basemapOptions} value={basemapId} onChange={onSelectBasemap} />
        <InspectionPicker inspections={inspections} selection={inspectionSelection} />
        <PhotoGroupPicker groups={photoGroups} selection={photoSelection} />
      </div>
    </aside>
  );
}
