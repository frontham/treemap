import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type PillProps = HTMLAttributes<HTMLDivElement>;

/**
 * A floating "chrome" container: rounded, hairline border, soft shadow,
 * translucent panel background with backdrop blur.
 */
export function Pill({ className, ...rest }: PillProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 h-9 px-3 rounded-full',
        'bg-panel/85 backdrop-blur-md hairline shadow-floating',
        className,
      )}
      {...rest}
    />
  );
}
