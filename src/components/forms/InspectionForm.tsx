'use client';

import { type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { TreeView } from '@/components/trees/TreeView';
import { SelectField } from './fields/SelectField';
import { NumberField } from './fields/NumberField';
import { DateField } from './fields/DateField';
import { TextareaField } from './fields/TextareaField';
import { CustomFieldRenderer } from './customFields/CustomFieldRenderer';
import { parseTreeFormValues } from './parseTreeFormData';

const HEALTH_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'dead', label: 'Dead' },
];

const CONDITION_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'critical', label: 'Critical' },
];

type Health = 'healthy' | 'fair' | 'poor' | 'dead' | 'unknown';
type Condition = 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';

export type InspectionFormValues = {
  inspectedOn: string;
  health: Health;
  condition: Condition;
  dbhCm?: number;
  heightM?: number;
  canopyRadiusM?: number;
  estimatedAgeYears?: number;
  notes?: string;
  customFields: Record<string, unknown>;
};

type Props = {
  /** Current tree values — every field is prefilled from these for review. */
  tree: TreeView;
  today: string; // YYYY-MM-DD, passed in (no Date() in render)
  onSubmit: (values: InspectionFormValues) => void | Promise<void>;
  onCancel: () => void;
  pending?: boolean;
};

/** New-inspection form: all condition fields prefilled from the tree, plus an
 *  inspection date. Reuses the tree field parser, including custom fields. */
export function InspectionForm({ tree, today, onSubmit, onCancel, pending }: Props) {
  const t = useT();
  const { data: defs = [] } = trpc.customFields.list.useQuery();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = parseTreeFormValues(fd, defs);
    const inspectedOn = (fd.get('inspectedOn') as string) || today;
    void onSubmit({
      inspectedOn,
      health: (v.health ?? 'unknown') as Health,
      condition: (v.condition ?? 'unknown') as Condition,
      dbhCm: v.dbhCm,
      heightM: v.heightM,
      canopyRadiusM: v.canopyRadiusM,
      estimatedAgeYears: v.estimatedAgeYears,
      notes: v.notes,
      customFields: v.customFields,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <DateField name="inspectedOn" label={t('insp.date')} defaultValue={today} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField name="health" label={t('insp.health')} options={HEALTH_OPTIONS} defaultValue={tree.health ?? 'unknown'} />
        <SelectField name="condition" label={t('insp.condition')} options={CONDITION_OPTIONS} defaultValue={tree.condition ?? 'unknown'} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <NumberField name="dbhCm" label={t('field.dbh')} suffix="cm" defaultValue={tree.dbhCm} />
        <NumberField name="heightM" label={t('field.height')} suffix="m" defaultValue={tree.heightM} />
        <NumberField name="estimatedAgeYears" label={t('field.age')} suffix="yrs" defaultValue={tree.estimatedAgeYears} />
      </div>
      <NumberField name="canopyRadiusM" label={t('field.canopy')} suffix="m" defaultValue={tree.canopyRadiusM} />
      <TextareaField name="notes" label={t('insp.notes')} defaultValue={tree.notes} />

      {defs.length > 0 ? (
        <section className="mt-1 flex flex-col gap-3 border-t border-hairline pt-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
            {t('field.orgFields')}
          </h3>
          {defs.map((def) => (
            <CustomFieldRenderer key={def.id} def={def} defaultValue={tree.customFields?.[def.key]} />
          ))}
        </section>
      ) : null}

      <div className="mt-2 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t('common.saving') : t('insp.save')}
        </Button>
      </div>
    </form>
  );
}
