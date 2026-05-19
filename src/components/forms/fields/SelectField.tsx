import { FieldShell, inputBase } from './FieldShell';
import { cn } from '@/lib/cn';

export type SelectOption = { value: string; label: string };

type Props = {
  name: string;
  label: string;
  options: SelectOption[];
  defaultValue?: string;
};

export function SelectField({ name, label, options, defaultValue }: Props) {
  return (
    <FieldShell label={label}>
      <select
        name={name}
        defaultValue={defaultValue}
        className={cn(inputBase, 'appearance-none pr-7')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
