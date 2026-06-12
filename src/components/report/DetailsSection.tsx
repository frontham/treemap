'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { useDateFormatter } from '@/lib/i18n/useDateFormatter';
import { formatFieldValue, nonEmptyFieldEntries } from '@/lib/fieldValues';
import type { TreeView } from '@/components/trees/TreeView';
import { SectionTitle } from './SectionTitle';
import { Fact } from './Fact';

/** The tree's facts grid: built-in fields followed by the filled custom fields. */
export function DetailsSection({
  no,
  tree,
  labelFor,
  yearsUnit,
}: {
  no: string;
  tree: TreeView;
  labelFor: (key: string) => string;
  yearsUnit: string;
}) {
  const t = useT();
  const fmtDate = useDateFormatter();
  return (
    <section className="report-block">
      <SectionTitle no={no}>{t('report.sectionDetails')}</SectionTitle>
      <dl className="grid grid-cols-2 gap-x-10">
        <Fact label={t('field.treeNo')} value={tree.treeNo?.toString()} mono />
        <Fact label={t('field.scientificName')} value={tree.scientificName} />
        <Fact label={t('field.commonName')} value={tree.commonName} />
        <Fact label={t('field.planted')} value={fmtDate(tree.plantedDate)} />
        <Fact
          label={t('field.age')}
          value={
            tree.estimatedAgeYears != null ? `±${tree.estimatedAgeYears} ${yearsUnit}` : undefined
          }
          mono
        />
        <Fact label={t('field.dbh')} value={tree.dbhCm != null ? `${tree.dbhCm} cm` : undefined} mono />
        <Fact
          label={t('field.height')}
          value={tree.heightM != null ? `${tree.heightM} m` : undefined}
          mono
        />
        <Fact
          label={t('field.canopy')}
          value={tree.canopyRadiusM != null ? `${tree.canopyRadiusM} m` : undefined}
          mono
        />
        <Fact label={t('field.health')} value={tree.health ? t(`health.${tree.health}`) : undefined} />
        <Fact
          label={t('field.condition')}
          value={tree.condition ? t(`condition.${tree.condition}`) : undefined}
        />
        <Fact label={t('field.risk')} value={tree.risk ? t(`risk.${tree.risk}`) : undefined} />
        <Fact label={t('field.lastInspected')} value={fmtDate(tree.lastInspectedOn)} />
        <Fact label={t('field.nextDue')} value={fmtDate(tree.nextInspectionOn)} />
        {nonEmptyFieldEntries(tree.customFields).map(([k, v]) => (
          <Fact key={k} label={labelFor(k)} value={formatFieldValue(v)} />
        ))}
      </dl>
    </section>
  );
}
