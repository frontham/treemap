import { Button } from '@/components/ui/Button';
import { EditIcon, LocateIcon } from '@/components/icons';

type Props = {
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
};

export function TreeDetailActions({ onEdit, onMove, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onEdit}>
          <EditIcon size={14} />
          Edit
        </Button>
        <Button variant="secondary" onClick={onMove}>
          <LocateIcon size={14} />
          Move
        </Button>
      </div>
      <Button variant="ghost" onClick={onDelete} className="text-danger hover:bg-danger/10">
        Delete
      </Button>
    </div>
  );
}
