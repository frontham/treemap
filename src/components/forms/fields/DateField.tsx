import { FieldShell, inputBase } from './FieldShell';
import { cn } from '@/lib/cn';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
};

export function DateField({ name, label, defaultValue }: Props) {
  return (
    <FieldShell label={label}>
      <input
        type="date"
        name={name}
        defaultValue={defaultValue}
        className={cn(inputBase, 'mono-num')}
      />
    </FieldShell>
  );
}
