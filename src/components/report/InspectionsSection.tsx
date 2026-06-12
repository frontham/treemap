'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { useDateFormatter } from '@/lib/i18n/useDateFormatter';
import { formatFieldValue, nonEmptyFieldEntries } from '@/lib/fieldValues';
import type { InspectionView } from '@/server/trpc/routers/inspections';
import { SectionTitle } from './SectionTitle';
import { Fact } from './Fact';

/** The selected inspections as dated cards, or a "none recorded" note. */
export function InspectionsSection({
  no,
  inspections,
  hasAny,
  labelFor,
  yearsUnit,
}: {
  no: string;
  /** The inspections picked for printing. */
  inspections: InspectionView[];
  /** Whether the tree has any inspections at all (controls the empty note). */
  hasAny: boolean;
  labelFor: (key: string) => string;
  yearsUnit: string;
}) {
  const t = useT();
  return (
    <section>
      <SectionTitle no={no}>{t('report.sectionInspections')}</SectionTitle>
      {!hasAny ? (
        <p className="text-xs text-muted">{t('report.noInspections')}</p>
      ) : (
        inspections.map((i) => (
          <InspectionCard key={i.id} inspection={i} labelFor={labelFor} yearsUnit={yearsUnit} />
        ))
      )}
    </section>
  );
}

/** One inspection: header (date + inspector), measurement facts, notes, custom fields. */
function InspectionCard({
  inspection: i,
  labelFor,
  yearsUnit,
}: {
  inspection: InspectionView;
  labelFor: (key: string) => string;
  yearsUnit: string;
}) {
  const t = useT();
  const fmtDate = useDateFormatter();
  return (
    <article className="report-block mt-3 rounded-sm border border-hairline first:mt-0">
      <header className="flex items-baseline justify-between gap-4 border-b border-hairline px-3 py-2">
        <h3 className="text-sm font-semibold">{fmtDate(i.inspectedOn)}</h3>
        <p className="text-xs text-muted">
          {t('report.inspector')}: {i.userName || i.inspectorName || i.userEmail || t('common.unknown')}
        </p>
      </header>
      <dl className="grid grid-cols-3 gap-x-6 px-3 pb-1 pt-0.5">
        <Fact label={t('field.health')} value={t(`health.${i.health}`)} />
        <Fact label={t('field.condition')} value={t(`condition.${i.condition}`)} />
        <Fact label={t('field.dbh')} value={i.dbhCm != null ? `${i.dbhCm} cm` : undefined} mono />
        <Fact label={t('field.height')} value={i.heightM != null ? `${i.heightM} m` : undefined} mono />
        <Fact
          label={t('field.canopy')}
          value={i.canopyRadiusM != null ? `${i.canopyRadiusM} m` : undefined}
          mono
        />
        <Fact
          label={t('field.age')}
          value={i.estimatedAgeYears != null ? `±${i.estimatedAgeYears} ${yearsUnit}` : undefined}
          mono
        />
      </dl>
      {i.notes ? (
        <p className="whitespace-pre-wrap px-3 pb-2 pt-1 text-xs text-ink">{i.notes}</p>
      ) : null}
      {nonEmptyFieldEntries(i.customFields ?? {}).length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-6 border-t border-hairline px-3 py-1.5">
          {nonEmptyFieldEntries(i.customFields ?? {}).map(([k, v]) => (
            <Fact key={k} label={labelFor(k)} value={formatFieldValue(v)} />
          ))}
        </dl>
      ) : null}
    </article>
  );
}
