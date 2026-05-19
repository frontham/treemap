import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: Size;
  label: string;
};

const sizes: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
};

export function IconButton({
  size = 'md',
  label,
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded text-ink',
        'transition-colors duration-fast ease-out-expo hover:bg-panel',
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
