import { Button } from '@/components/ui/Button';
import { EditIcon, LocateIcon } from '@/components/icons';
import { useT } from '@/lib/i18n/LocaleProvider';

type Props = {
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
};

export function TreeDetailActions({ onEdit, onMove, onDelete }: Props) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onEdit}>
          <EditIcon size={14} />
          {t('common.edit')}
        </Button>
        <Button variant="secondary" onClick={onMove}>
          <LocateIcon size={14} />
          {t('tree.move')}
        </Button>
      </div>
      <Button variant="ghost" onClick={onDelete} className="text-danger hover:bg-danger/10">
        {t('common.delete')}
      </Button>
    </div>
  );
}
