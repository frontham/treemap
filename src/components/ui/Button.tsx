import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  'inline-flex items-center justify-center gap-1.5 rounded font-medium ' +
  'transition-colors duration-fast ease-out-expo ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/90',
  secondary: 'bg-panel text-ink hairline hover:bg-paper',
  ghost: 'text-ink hover:bg-panel',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-sm',
  md: 'h-9 px-3.5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
}
