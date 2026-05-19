'use client';

import { useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { LocateIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useMap } from './MapContext';

/**
 * Asks the browser for the user's GPS position (high accuracy) and flies the
 * map there. Disabled until the map is ready; shows a pulse while resolving.
 */
export function LocateMeButton() {
  const { map } = useMap();
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    if (!map || busy) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: Math.max(map.getZoom(), 17),
          essential: true,
        });
        setBusy(false);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[locate-me]', err);
        setBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );
  };

  return (
    <IconButton
      label="Locate me"
      onClick={handleClick}
      disabled={!map || busy}
      className={cn('rounded-full text-accent', busy && 'animate-pulse')}
    >
      <LocateIcon size={16} />
    </IconButton>
  );
}
