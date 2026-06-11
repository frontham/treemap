'use client';

import { useEffect, useRef } from 'react';
import { Marker } from 'maplibre-gl';
import { IconButton } from '@/components/ui/IconButton';
import { LocateIcon } from '@/components/icons';
import { useMap } from './MapContext';
import { useT } from '@/lib/i18n/LocaleProvider';

/** A simple blue "you are here" dot. */
function markerEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;' +
    'box-shadow:0 1px 4px rgba(0,0,0,.4);pointer-events:none;';
  return el;
}

/**
 * Shows the user's live position as an always-on dot (watchPosition), and acts
 * as a "focus on me" button: tap to recenter the map on the current position.
 * The GPS watch is paused while the tab is hidden, to save battery.
 */
export function UserLocationButton({ onActivate }: { onActivate?: () => void }) {
  const { map } = useMap();
  const t = useT();
  const posRef = useRef<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!map) return;

    const marker = new Marker({ element: markerEl(), anchor: 'center' });
    let added = false;
    let watchId: number | null = null;

    const start = () => {
      if (watchId != null) return;
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { longitude: lng, latitude: lat } = pos.coords;
          posRef.current = { lng, lat };
          marker.setLngLat([lng, lat]);
          if (!added) {
            marker.addTo(map);
            added = true;
          }
        },
        (err) => {
          // eslint-disable-next-line no-console
          console.error('[user-location]', err); // surfaced on demand via recenter()
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15_000 },
      );
    };
    const stop = () => {
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    start();
    // Battery: don't keep the GPS running while the tab/app is backgrounded.
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      marker.remove();
    };
  }, [map]);

  const recenter = () => {
    onActivate?.(); // let the cluster close any open card
    if (!map) return;
    const pos = posRef.current;
    if (!pos) {
      window.alert(t('controls.locationUnavailable'));
      return;
    }
    map.easeTo({
      center: [pos.lng, pos.lat],
      zoom: Math.max(map.getZoom(), 17),
      essential: true,
    });
  };

  return (
    <IconButton
      label={t('controls.location')}
      onClick={recenter}
      disabled={!map}
      className="rounded-full text-accent"
    >
      <LocateIcon size={16} />
    </IconButton>
  );
}
