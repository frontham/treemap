import { PlusIcon } from '@/components/icons';
import type { TreePhotoView } from './TreeView';

type Props = { photos: TreePhotoView[] };

export function TreePhotosStrip({ photos }: Props) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Photos</h3>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <Thumb key={p.id} url={p.thumbnailUrl} caption={p.caption} />
        ))}
        <AddThumb />
      </div>
    </section>
  );
}

function Thumb({ url, caption }: { url?: string; caption?: string }) {
  return (
    <div className="h-16 w-16 overflow-hidden rounded bg-panel hairline">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={caption ?? ''} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

function AddThumb() {
  return (
    <button
      type="button"
      aria-label="Add photo"
      className="flex h-16 w-16 items-center justify-center rounded bg-panel hairline text-muted transition-colors hover:bg-paper"
    >
      <PlusIcon size={16} />
    </button>
  );
}
