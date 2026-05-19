import { TextField } from '../fields/TextField';
import { NumberField } from '../fields/NumberField';
import { SelectField } from '../fields/SelectField';
import { DateField } from '../fields/DateField';
import { FieldShell, inputBase } from '../fields/FieldShell';
import { cn } from '@/lib/cn';
import type { CustomFieldDefView } from '@/server/trpc/routers/customFields';

type Props = {
  def: CustomFieldDefView;
  defaultValue?: unknown;
};

/**
 * Renders one field from a custom_field_def. The HTML name is "cf.<key>" so
 * a single FormData walk can split standard vs custom values.
 */
export function CustomFieldRenderer({ def, defaultValue }: Props) {
  const name = `cf.${def.key}`;
  const label = def.required ? `${def.label} *` : def.label;

  switch (def.type) {
    case 'text':
      return (
        <TextField name={name} label={label} defaultValue={asString(defaultValue)} />
      );
    case 'number':
      return (
        <NumberField name={name} label={label} defaultValue={asNumber(defaultValue)} />
      );
    case 'date':
      return <DateField name={name} label={label} defaultValue={asString(defaultValue)} />;
    case 'select':
      return (
        <SelectField
          name={name}
          label={label}
          defaultValue={asString(defaultValue) ?? ''}
          options={[
            { value: '', label: '—' },
            ...(def.options ?? []).map((o) => ({ value: o, label: o })),
          ]}
        />
      );
    case 'boolean':
      return <BooleanField name={name} label={label} defaultChecked={!!defaultValue} />;
    case 'multiselect':
      return (
        <MultiselectField
          name={name}
          label={label}
          options={def.options ?? []}
          defaultValue={asStringArray(defaultValue)}
        />
      );
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function BooleanField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        value="true"
        className="h-4 w-4 rounded border-hairline text-accent focus:ring-accent"
      />
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

function MultiselectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue: string[];
}) {
  return (
    <FieldShell label={label}>
      <select
        name={name}
        multiple
        defaultValue={defaultValue}
        className={cn(inputBase, 'h-auto min-h-[6rem] py-1')}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
