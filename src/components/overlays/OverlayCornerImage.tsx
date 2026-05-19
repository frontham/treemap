import { cn } from '@/lib/cn';

export type Corner = 'tl' | 'tr' | 'br' | 'bl';
type LngLat = { lng: number; lat: number };

type Props = {
  imageUrl: string;
  corners: Partial<Record<Corner, LngLat>>;
  current: Corner;
};

const POSITIONS: Record<Corner, { top: string; left: string }> = {
  tl: { top: '0%', left: '0%' },
  tr: { top: '0%', left: '100%' },
  br: { top: '100%', left: '100%' },
  bl: { top: '100%', left: '0%' },
};

const LABELS: Record<Corner, string> = { tl: '1', tr: '2', br: '3', bl: '4' };

/**
 * Renders the source image with four corner dots overlayed. The active corner
 * pulses, placed corners turn sage, the rest are muted. Dots sit at the image
 * container's corners; for letterboxed images they may sit outside the visible
 * pixels — fine for v1.
 */
export function OverlayCornerImage({ imageUrl, corners, current }: Props) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden border-r border-hairline bg-panel">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="text-xs text-muted">
          Paste an image URL below to preview
        </span>
      )}
      {(['tl', 'tr', 'br', 'bl'] as Corner[]).map((c) => (
        <CornerDot
          key={c}
          corner={c}
          placed={!!corners[c]}
          active={c === current}
        />
      ))}
    </div>
  );
}

function CornerDot({
  corner,
  placed,
  active,
}: {
  corner: Corner;
  placed: boolean;
  active: boolean;
}) {
  const pos = POSITIONS[corner];
  return (
    <div
      className={cn(
        'absolute flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white shadow-pin',
        placed ? 'bg-sage' : active ? 'animate-pulse bg-accent' : 'bg-muted',
      )}
      style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
    >
      {LABELS[corner]}
    </div>
  );
}
