'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { useDateFormatter } from '@/lib/i18n/useDateFormatter';
import type { TreeView } from '@/components/trees/TreeView';

/** Sheet header: report title + project, species names, tree number, print date. */
export function ReportMasthead({ tree, projectName }: { tree: TreeView; projectName: string }) {
  const t = useT();
  const fmtDate = useDateFormatter();
  return (
    <header className="report-block">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {t('report.title')} · {projectName}
        </p>
        <p className="mono-num text-xs text-muted">{fmtDate(new Date())}</p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-6 border-b-2 border-ink pb-4">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold italic leading-tight tracking-tighter">
            {tree.scientificName ?? tree.commonName}
          </h1>
          {tree.scientificName ? (
            <p className="mt-1 text-md text-muted">{tree.commonName}</p>
          ) : null}
        </div>
        {tree.treeNo != null ? (
          <div className="shrink-0 text-right">
            <p className="text-xs uppercase tracking-wider text-muted">{t('field.treeNo')}</p>
            <p className="mono-num text-[26px] font-medium leading-none">{tree.treeNo}</p>
          </div>
        ) : null}
      </div>
    </header>
  );
}
