import { CloseIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/IconButton';

type Props = {
  commonName: string;
  scientificName?: string;
  onClose: () => void;
};

export function TreeDetailHeader({ commonName, scientificName, onClose }: Props) {
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
      <IconButton label="Close" onClick={onClose}>
        <CloseIcon size={16} />
      </IconButton>
    </header>
  );
}
