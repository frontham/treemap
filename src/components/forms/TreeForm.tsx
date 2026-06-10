'use client';

import { type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { formatLngLat } from '@/lib/formatCoord';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { TreeView } from '@/components/trees/TreeView';
import { TextField } from './fields/TextField';
import { NumberField } from './fields/NumberField';
import { SelectField } from './fields/SelectField';
import { DateField } from './fields/DateField';
import { TextareaField } from './fields/TextareaField';
import { CustomFieldRenderer } from './customFields/CustomFieldRenderer';
import { parseTreeFormValues, type TreeFormValues } from './parseTreeFormData';

const HEALTH_VALUES = ['unknown', 'healthy', 'fair', 'poor', 'dead'];
const CONDITION_VALUES = ['unknown', 'excellent', 'good', 'fair', 'poor', 'critical'];
const RISK_VALUES = ['unknown', 'low', 'moderate', 'high'];

type Props = {
  location: { lng: number; lat: number };
  initial?: Partial<TreeView>;
  mode?: 'create' | 'edit';
  onSubmit: (values: TreeFormValues) => void | Promise<void>;
  onCancel: () => void;
  footerLeft?: ReactNode;
};

/**
 * Used both for creating and editing a tree. Standard fields are inline;
 * custom fields are appended from the org's custom_field_defs.
 */
export function TreeForm({
  location,
  initial,
  mode = 'create',
  onSubmit,
  onCancel,
  footerLeft,
}: Props) {
  const t = useT();
  const healthOptions = HEALTH_VALUES.map((v) => ({ value: v, label: t(`health.${v}`) }));
  const conditionOptions = CONDITION_VALUES.map((v) => ({ value: v, label: t(`condition.${v}`) }));
  const riskOptions = RISK_VALUES.map((v) => ({ value: v, label: t(`risk.${v}`) }));
  const { data: defs = [] } = trpc.customFields.list.useQuery();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void onSubmit(parseTreeFormValues(new FormData(e.currentTarget), defs));
  };

  const title = mode === 'edit' ? t('treeForm.editTitle') : t('treeForm.newTitle');
  const submitLabel = mode === 'edit' ? t('treeForm.saveChanges') : t('common.save');

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <header className="p-5 pb-3">
        <h2 className="text-lg font-medium tracking-tight text-ink">{title}</h2>
        <div className="mono-num mt-0.5 text-xs text-muted">
          {formatLngLat(location.lng, location.lat)}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5">
        <TextField
          name="commonName"
          label={t('field.commonName')}
          placeholder="e.g. English oak"
          defaultValue={initial?.commonName}
        />
        <TextField
          name="scientificName"
          label={t('field.scientificName')}
          placeholder="e.g. Quercus robur"
          defaultValue={initial?.scientificName}
        />

        {/* Identity — always editable (not mirrored from inspections). */}
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            name="risk"
            label={t('field.risk')}
            options={riskOptions}
            defaultValue={initial?.risk ?? 'unknown'}
          />
          <DateField
            name="nextInspectionOn"
            label={t('field.nextDue')}
            defaultValue={initial?.nextInspectionOn}
          />
        </div>
        <DateField name="plantedDate" label={t('field.planted')} defaultValue={initial?.plantedDate} />

        {mode === 'edit' ? (
          <p className="rounded-md bg-panel/60 px-3 py-2 text-xs text-muted hairline">
            {t('treeForm.assessmentHint')}
          </p>
        ) : (
          // Condition is inspection-owned, so it's only set here when first
          // placing the tree; afterwards it's changed via "Update assessment".
          <>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                name="health"
                label={t('field.health')}
                options={healthOptions}
                defaultValue={initial?.health ?? 'unknown'}
              />
              <SelectField
                name="condition"
                label={t('field.condition')}
                options={conditionOptions}
                defaultValue={initial?.condition ?? 'unknown'}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumberField name="dbhCm" label={t('field.dbh')} suffix="cm" defaultValue={initial?.dbhCm} />
              <NumberField name="heightM" label={t('field.height')} suffix="m" defaultValue={initial?.heightM} />
              <NumberField
                name="estimatedAgeYears"
                label={t('field.age')}
                suffix="yrs"
                defaultValue={initial?.estimatedAgeYears}
              />
            </div>
            <TextareaField name="notes" label={t('field.notes')} defaultValue={initial?.notes} />

            {defs.length > 0 ? (
              <section className="mt-2 flex flex-col gap-3 border-t border-hairline pt-4">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                  {t('field.orgFields')}
                </h3>
                {defs.map((def) => (
                  <CustomFieldRenderer
                    key={def.id}
                    def={def}
                    defaultValue={initial?.customFields?.[def.key]}
                  />
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-hairline p-4">
        <div>{footerLeft}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </footer>
    </form>
  );
}
