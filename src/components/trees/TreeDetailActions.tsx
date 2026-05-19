import { Button } from '@/components/ui/Button';
import { EditIcon } from '@/components/icons';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
};

export function TreeDetailActions({ onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Button variant="secondary" onClick={onEdit}>
        <EditIcon size={14} />
        Edit
      </Button>
      <Button variant="ghost" onClick={onDelete} className="text-danger hover:bg-danger/10">
        Delete
      </Button>
    </div>
  );
}
