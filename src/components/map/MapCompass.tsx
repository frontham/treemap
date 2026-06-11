'use client';

import { useEffect, useRef } from 'react';
import { useMap } from './MapContext';
import { useT } from '@/lib/i18n/LocaleProvider';
import { colors } from '@/styles/tokens';

/**
 * Small compass beside the coordinate readout. The needle points to true north
 * as the map rotates (e.g. a two-finger rotate); tap it to snap the map back to
 * north.
 */
export function MapCompass() {
  const { map } = useMap();
  const t = useT();
  const needleRef = useRef<HTMLDivElement>(null);

  // Keep the needle aimed at true north as the map rotates. Imperative (style on
  // a ref) so a continuous rotate gesture doesn't re-render React each frame.
  useEffect(() => {
    if (!map) return;
    const update = () => {
      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${-map.getBearing()}deg)`;
      }
    };
    update();
    map.on('rotate', update);
    return () => {
      map.off('rotate', update);
    };
  }, [map]);

  return (
    <button
      type="button"
      onClick={() => map?.easeTo({ bearing: 0, duration: 400 })}
      aria-label={t('compass.label')}
      title={t('compass.label')}
      className="pointer-events-auto absolute bottom-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-panel/85 backdrop-blur-md hairline shadow-floating transition-colors hover:bg-paper"
    >
      <div ref={needleRef} className="h-5 w-5">
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          {/* North half accent, south half muted. */}
          <polygon points="12,2.5 15.5,12 8.5,12" fill={colors.accent} />
          <polygon points="12,21.5 15.5,12 8.5,12" fill={colors.muted} />
        </svg>
      </div>
    </button>
  );
}
