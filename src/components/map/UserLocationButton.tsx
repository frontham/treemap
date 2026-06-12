'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker } from 'maplibre-gl';
import { IconButton } from '@/components/ui/IconButton';
import { LocateIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useMap } from './MapContext';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useToast } from '@/components/ui/toast/ToastProvider';

/** A simple blue "you are here" dot. */
function markerEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;' +
    'box-shadow:0 1px 4px rgba(0,0,0,.4);pointer-events:none;';
  return el;
}

/**
 * The user's live position as an always-on dot (watchPosition). Tap the locate
 * button to recenter on it and *follow* as they move; a manual pan stops the
 * follow (so it never yanks the map back), and tapping again resumes. The GPS
 * watch is paused while the tab is hidden, to save battery.
 */
export function UserLocationButton({ onActivate }: { onActivate?: () => void }) {
  const { map } = useMap();
  const t = useT();
  const toast = useToast();
  const posRef = useRef<{ lng: number; lat: number } | null>(null);
  const followingRef = useRef(false);
  const [following, setFollowing] = useState(false);

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
          // Following: keep the dot in view, recentering only once it nears the
          // edge so it doesn't jitter while standing still.
          if (followingRef.current) {
            const p = map.project([lng, lat]);
            const c = map.getContainer();
            const mx = c.clientWidth * 0.25;
            const my = c.clientHeight * 0.25;
            if (p.x < mx || p.x > c.clientWidth - mx || p.y < my || p.y > c.clientHeight - my) {
              map.easeTo({ center: [lng, lat], duration: 600, essential: true });
            }
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

    // A manual pan stops following (dragstart only fires for user drags, not the
    // programmatic recenters above), so we never fight the user.
    const onDrag = () => {
      followingRef.current = false;
      setFollowing(false);
    };
    map.on('dragstart', onDrag);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      map.off('dragstart', onDrag);
      marker.remove();
    };
  }, [map]);

  const recenter = () => {
    onActivate?.(); // let the cluster close any open card
    if (!map) return;
    const pos = posRef.current;
    if (!pos) {
      toast.error(t('controls.locationUnavailable'));
      return;
    }
    followingRef.current = true;
    setFollowing(true);
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
      aria-pressed={following}
      className={cn('rounded-full', following && 'bg-paper text-accent')}
    >
      <LocateIcon size={16} />
    </IconButton>
  );
}
