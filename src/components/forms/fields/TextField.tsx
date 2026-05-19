import { FieldShell, inputBase } from './FieldShell';

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
};

export function TextField({ name, label, defaultValue, placeholder }: Props) {
  return (
    <FieldShell label={label}>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputBase}
      />
    </FieldShell>
  );
}
