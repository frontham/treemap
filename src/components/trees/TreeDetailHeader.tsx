import Link from 'next/link';
import type { Route } from 'next';
import { CloseIcon, PrinterIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/IconButton';

type Props = {
  commonName: string;
  scientificName?: string;
  onClose: () => void;
  /** When set, shows a printer icon opening the printable report in a new tab. */
  reportHref?: string;
  reportLabel?: string;
};

export function TreeDetailHeader({
  commonName,
  scientificName,
  onClose,
  reportHref,
  reportLabel,
}: Props) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="truncate font-medium italic tracking-tight text-lg text-ink">
          {scientificName ?? commonName}
        </h2>
        {scientificName ? (
          <div className="mt-0.5 truncate text-sm text-muted">{commonName}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">
        {reportHref ? (
          <Link
            href={reportHref as Route}
            target="_blank"
            aria-label={reportLabel}
            title={reportLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded text-ink transition-colors duration-fast ease-out-expo hover:bg-panel"
          >
            <PrinterIcon size={16} />
          </Link>
        ) : null}
        <IconButton label="Close" onClick={onClose}>
          <CloseIcon size={16} />
        </IconButton>
      </div>
    </header>
  );
}
