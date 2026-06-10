import { cn } from '@/lib/cn';
import { formatLngLat } from '@/lib/formatCoord';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { TreeView } from './TreeView';

type Props = { tree: TreeView; variant: 'identity' | 'assessment' };

const HEALTH_COLOR: Record<string, string> = {
  healthy: 'bg-sage',
  fair: 'bg-warn',
  poor: 'bg-warn',
  dead: 'bg-danger',
  unknown: 'bg-hairline',
};

/**
 * Tree attributes, split by ownership:
 *   - 'identity'   — the tree's own facts (editable on Details).
 *   - 'assessment' — condition/measurements mirrored from the latest inspection
 *                    (read-only on Details; changed via "Update assessment").
 */
export function TreeAttributesGrid({ tree, variant }: Props) {
  const t = useT();
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {variant === 'identity' ? (
        <>
          <Row label={t('field.id')} value={tree.id} mono />
          <Row
            label={t('field.treeNo')}
            value={tree.treeNo != null ? String(tree.treeNo) : undefined}
            mono
          />
          <Row label={t('field.risk')} value={tree.risk ? t(`risk.${tree.risk}`) : undefined} />
          <Row label={t('field.nextDue')} value={tree.nextInspectionOn} mono />
          <Row label={t('field.planted')} value={tree.plantedDate} mono />
          <Row
            label={t('field.location')}
            value={formatLngLat(tree.location.lng, tree.location.lat)}
            mono
          />
        </>
      ) : (
        <>
          <Row
            label={t('field.health')}
            value={tree.health ? t(`health.${tree.health}`) : undefined}
            dotClass={tree.health ? HEALTH_COLOR[tree.health] : undefined}
          />
          <Row
            label={t('field.condition')}
            value={tree.condition ? t(`condition.${tree.condition}`) : undefined}
          />
          <Row
            label={t('field.dbh')}
            value={tree.dbhCm != null ? `${tree.dbhCm} cm` : undefined}
            mono
          />
          <Row
            label={t('field.height')}
            value={tree.heightM != null ? `${tree.heightM} m` : undefined}
            mono
          />
          <Row
            label={t('field.age')}
            value={tree.estimatedAgeYears != null ? `~${tree.estimatedAgeYears} yrs` : undefined}
            mono
          />
        </>
      )}
    </dl>
  );
}

type RowProps = {
  label: string;
  value?: string;
  mono?: boolean;
  dotClass?: string;
};

function Row({ label, value, mono, dotClass }: RowProps) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className={cn('flex items-center gap-2 text-ink', mono && 'mono-num')}>
        {dotClass ? <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden /> : null}
        {value ?? <span className="text-muted">—</span>}
      </dd>
    </>
  );
}
