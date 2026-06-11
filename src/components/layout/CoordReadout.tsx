import { formatCoord } from '@/lib/formatCoord';

type Props = { lng: number; lat: number };

/**
 * Quiet mono coordinate readout pinned to the bottom-left of the map.
 * Presentational — fed by CursorCoordReadout in the live map.
 */
export function CoordReadout({ lng, lat }: Props) {
  // Offset to sit just right of the compass (bottom-4 left-4, ~36px wide).
  return (
    <div className="pointer-events-none absolute bottom-4 left-[3.75rem] z-20">
      <div className="inline-flex items-center gap-3 rounded bg-panel/85 backdrop-blur-md hairline px-2.5 py-1.5 shadow-floating mono-num text-xs text-ink">
        <span>{formatCoord(lat, 'N', 'S')}</span>
        <span>{formatCoord(lng, 'E', 'W')}</span>
      </div>
    </div>
  );
}
