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

const HEALTH_VALUES = ['unknown', 'healthy', 'fair', 'poor', 'dead'];
const CONDITION_VALUES = ['unknown', 'excellent', 'good', 'fair', 'poor', 'critical'];

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

/** The subset of an inspection we prefill when editing an existing one. */
export type InspectionInitial = {
  inspectedOn: string | Date;
  health?: string | null;
  condition?: string | null;
  dbhCm?: number | null;
  heightM?: number | null;
  canopyRadiusM?: number | null;
  estimatedAgeYears?: number | null;
  notes?: string | null;
  customFields?: Record<string, unknown> | null;
};

type Props = {
  /** Current tree values — used to prefill a brand-new inspection. */
  tree: TreeView;
  today: string; // YYYY-MM-DD, passed in (no Date() in render)
  /** When set, edit this existing inspection (prefilled from it, not the tree). */
  initial?: InspectionInitial;
  onSubmit: (values: InspectionFormValues) => void | Promise<void>;
  onCancel: () => void;
  pending?: boolean;
};

function toDateInput(v: string | Date): string {
  return v instanceof Date ? v.toISOString().slice(0, 10) : v.slice(0, 10);
}

/** New/edit inspection form. Creating prefills from the tree's current values;
 *  editing prefills from the inspection itself. Reuses the tree field parser. */
export function InspectionForm({ tree, today, initial, onSubmit, onCancel, pending }: Props) {
  const t = useT();
  const isEdit = !!initial;
  const healthOptions = HEALTH_VALUES.map((v) => ({ value: v, label: t(`health.${v}`) }));
  const conditionOptions = CONDITION_VALUES.map((v) => ({ value: v, label: t(`condition.${v}`) }));
  const { data: defs = [] } = trpc.customFields.list.useQuery();

  const base = initial
    ? {
        inspectedOn: toDateInput(initial.inspectedOn),
        health: initial.health ?? 'unknown',
        condition: initial.condition ?? 'unknown',
        dbhCm: initial.dbhCm ?? undefined,
        heightM: initial.heightM ?? undefined,
        canopyRadiusM: initial.canopyRadiusM ?? undefined,
        estimatedAgeYears: initial.estimatedAgeYears ?? undefined,
        notes: initial.notes ?? undefined,
        customFields: initial.customFields ?? {},
      }
    : {
        inspectedOn: today,
        health: tree.health ?? 'unknown',
        condition: tree.condition ?? 'unknown',
        dbhCm: tree.dbhCm,
        heightM: tree.heightM,
        canopyRadiusM: tree.canopyRadiusM,
        estimatedAgeYears: tree.estimatedAgeYears,
        notes: tree.notes,
        customFields: tree.customFields ?? {},
      };

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
      {isEdit ? (
        <h3 className="text-sm font-medium text-ink">{t('insp.edit')}</h3>
      ) : null}
      <DateField name="inspectedOn" label={t('insp.date')} defaultValue={base.inspectedOn} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField name="health" label={t('insp.health')} options={healthOptions} defaultValue={base.health} />
        <SelectField name="condition" label={t('insp.condition')} options={conditionOptions} defaultValue={base.condition} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <NumberField name="dbhCm" label={t('field.dbh')} suffix="cm" defaultValue={base.dbhCm} />
        <NumberField name="heightM" label={t('field.height')} suffix="m" defaultValue={base.heightM} />
        <NumberField name="estimatedAgeYears" label={t('field.age')} suffix="yrs" defaultValue={base.estimatedAgeYears} />
      </div>
      <NumberField name="canopyRadiusM" label={t('field.canopy')} suffix="m" defaultValue={base.canopyRadiusM} />
      <TextareaField name="notes" label={t('insp.notes')} defaultValue={base.notes} />

      {defs.length > 0 ? (
        <section className="mt-1 flex flex-col gap-3 border-t border-hairline pt-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
            {t('field.orgFields')}
          </h3>
          {defs.map((def) => (
            <CustomFieldRenderer key={def.id} def={def} defaultValue={base.customFields?.[def.key]} />
          ))}
        </section>
      ) : null}

      <div className="mt-2 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t('common.saving') : isEdit ? t('insp.update') : t('insp.save')}
        </Button>
      </div>
    </form>
  );
}
