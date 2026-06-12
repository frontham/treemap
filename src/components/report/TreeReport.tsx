'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useSelectionSet } from '@/lib/useSelectionSet';
import { Spinner } from '@/components/ui/Spinner';
import type { BasemapId } from '@/components/map/basemaps';
import { PRINT_BASEMAPS, inNetherlands, printAttribution } from './printBasemaps';
import { useTreeReportData, type PrintPhoto } from './useTreeReportData';
import { ReportShell } from './ReportShell';
import { ReportConfigRail } from './ReportConfigRail';
import { ReportSheet } from './ReportSheet';
import './report.css';

type Props = { orgSlug: string; projectSlug: string; treeId: string };

/**
 * Printable per-tree report (e.g. for a municipal permit filing): tree facts,
 * the selected inspections, the selected photos, and two map snapshots (detail
 * + surroundings) with the tree marked. The left rail configures what goes in
 * and is hidden in print; the sheet itself is laid out for A4.
 */
export function TreeReport({ orgSlug, projectSlug, treeId }: Props) {
  const t = useT();
  const { tree, inspections, error, projectName, labelFor, photoGroups } = useTreeReportData(
    treeId,
    projectSlug,
  );

  const [basemapId, setBasemapId] = useState<BasemapId>('streets');
  const inspectionSelection = useSelectionSet();
  const photoSelection = useSelectionSet();
  const [ready, setReady] = useState(false);

  // Defaults once both queries land: latest inspection, its evidence photos +
  // the general tree photos, and the Dutch topo map when the tree is in NL.
  useEffect(() => {
    if (ready || !tree || !inspections) return;
    const latest = inspections[0];
    inspectionSelection.reset(latest ? [latest.id] : []);
    photoSelection.reset([...tree.photos, ...(latest?.photos ?? [])].map((p) => p.id));
    setBasemapId(inNetherlands(tree.location) ? 'topo-nl' : 'streets');
    setReady(true);
  }, [ready, tree, inspections, inspectionSelection, photoSelection]);

  if (error) {
    return (
      <ReportShell orgSlug={orgSlug} projectSlug={projectSlug}>
        <p className="text-sm text-muted">{t('report.notFound')}</p>
      </ReportShell>
    );
  }
  if (!ready || !tree || !inspections) {
    return (
      <ReportShell orgSlug={orgSlug} projectSlug={projectSlug}>
        <Spinner size={24} />
      </ReportShell>
    );
  }

  const basemapOptions = PRINT_BASEMAPS.filter(
    (b) => !b.nlOnly || inNetherlands(tree.location),
  ).map((b) => b.id);
  const printInspections = inspections.filter((i) => inspectionSelection.has(i.id));
  const printPhotos: PrintPhoto[] = photoGroups.flatMap((g) =>
    g.photos.filter((p) => photoSelection.has(p.id)).map((p) => ({ ...p, groupLabel: g.label })),
  );

  return (
    <div className="min-h-screen bg-panel text-ink print:bg-white">
      <div className="mx-auto flex max-w-[1240px] items-start gap-8 px-4 py-8 print:block print:max-w-none print:p-0">
        <ReportConfigRail
          orgSlug={orgSlug}
          projectSlug={projectSlug}
          projectName={projectName}
          basemapOptions={basemapOptions}
          basemapId={basemapId}
          onSelectBasemap={setBasemapId}
          inspections={inspections}
          inspectionSelection={inspectionSelection}
          photoGroups={photoGroups}
          photoSelection={photoSelection}
        />
        <main className="min-w-0 flex-1 overflow-x-auto print:overflow-visible">
          <ReportSheet
            tree={tree}
            projectName={projectName}
            basemapId={basemapId}
            attribution={printAttribution(basemapId)}
            inspections={printInspections}
            hasAnyInspections={inspections.length > 0}
            photos={printPhotos}
            labelFor={labelFor}
          />
        </main>
      </div>
    </div>
  );
}
