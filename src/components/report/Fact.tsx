import { cn } from '@/lib/cn';

/** One label/value line in a facts grid. Empty values print as an em dash so
 *  the document reads as "checked, not applicable" rather than omitted. */
export function Fact({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-1.5">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className={cn('min-w-0 break-words text-right text-xs text-ink', mono && 'mono-num')}>
        {value ?? '—'}
      </dd>
    </div>
  );
}
