import { FieldShell } from './FieldShell';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
};

export function TextareaField({ name, label, defaultValue, rows = 3 }: Props) {
  return (
    <FieldShell label={label}>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="rounded bg-paper hairline px-2.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </FieldShell>
  );
}
