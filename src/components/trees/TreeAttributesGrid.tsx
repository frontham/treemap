import { cn } from '@/lib/cn';
import { formatLngLat } from '@/lib/formatCoord';
import type { TreeView } from './TreeView';

type Props = { tree: TreeView };

const HEALTH_COLOR: Record<string, string> = {
  healthy: 'bg-sage',
  fair: 'bg-warn',
  poor: 'bg-warn',
  dead: 'bg-danger',
  unknown: 'bg-hairline',
};

export function TreeAttributesGrid({ tree }: Props) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      <Row label="ID" value={tree.id} mono />
      <Row
        label="Health"
        value={tree.health}
        dotClass={tree.health ? HEALTH_COLOR[tree.health] : undefined}
      />
      <Row label="DBH" value={tree.dbhCm != null ? `${tree.dbhCm} cm` : undefined} mono />
      <Row label="Height" value={tree.heightM != null ? `${tree.heightM} m` : undefined} mono />
      <Row
        label="Age"
        value={tree.estimatedAgeYears != null ? `~${tree.estimatedAgeYears} yrs` : undefined}
        mono
      />
      <Row label="Planted" value={tree.plantedDate} mono />
      <Row label="Location" value={formatLngLat(tree.location.lng, tree.location.lat)} mono />
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
