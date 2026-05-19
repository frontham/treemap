import { FieldShell, inputBase } from './FieldShell';
import { cn } from '@/lib/cn';

type Props = {
  name: string;
  label: string;
  defaultValue?: number;
  suffix?: string;
};

export function NumberField({ name, label, defaultValue, suffix }: Props) {
  return (
    <FieldShell label={label}>
      <div className="relative">
        <input
          type="number"
          name={name}
          step="any"
          defaultValue={defaultValue}
          className={cn(inputBase, 'mono-num w-full', suffix && 'pr-9')}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}
