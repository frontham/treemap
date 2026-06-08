'use client';

import { useState } from 'react';
import { useCompose } from './ComposeContext';
import { useMap } from './MapContext';
import { useT } from '@/lib/i18n/LocaleProvider';

/**
 * Instruction banner shown while in 'placing' mode. Offers both ways to set the
 * location: tap the map, or drop the tree at the device's GPS position.
 */
export function ComposeBanner() {
  const { mode, setDraft } = useCompose();
  const { map } = useMap();
  const t = useT();
  const [locating, setLocating] = useState(false);

  if (mode !== 'placing') return null;

  const useMyLocation = () => {
    if (locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;
        map?.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 18), essential: true });
        setDraft({ lng, lat }, { source: 'current_location', accuracyM: pos.coords.accuracy });
        setLocating(false);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[add-at-location]', err);
        window.alert("Couldn't get your location. Check location permissions and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/90 px-3.5 py-1.5 text-xs text-paper shadow-floating">
        <span>{t('compose.tapToPlace')}</span>
        <span className="text-paper/40">·</span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="font-medium underline underline-offset-2 hover:text-white disabled:opacity-60"
        >
          {locating ? t('compose.locating') : t('compose.useLocation')}
        </button>
        <span className="text-paper/40">·</span>
        <span className="mono-num">Esc</span>
      </div>
    </div>
  );
}
