'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker } from 'maplibre-gl';
import { IconButton } from '@/components/ui/IconButton';
import { LocateIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useMap } from './MapContext';

type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationPermissionApi = { requestPermission?: () => Promise<'granted' | 'denied'> };

/** Blue dot + a fading heading "beam", like Google Maps. The dot is the centre;
 *  the beam points the way the device is facing (hidden until a heading is known). */
function markerEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:48px;height:48px;pointer-events:none;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5));';
  el.innerHTML =
    '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="ulBeam" x1="24" y1="24" x2="24" y2="3" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#2563eb" stop-opacity="0.5"/>' +
    '<stop offset="1" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs>' +
    '<path class="ul-beam" d="M24 24 L9 6 Q24 0 39 6 Z" fill="url(#ulBeam)" style="display:none"/>' +
    '<circle cx="24" cy="24" r="8" fill="#2563eb" stroke="#fff" stroke-width="3"/>' +
    '</svg>';
  return el;
}

/**
 * Toggle in the control cluster that shows the user's live position and keeps
 * it updated as they move (watchPosition), plus a heading beam from the device
 * compass. Recenters once on enable. Tap again to hide.
 */
export function UserLocationButton() {
  const { map } = useMap();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!map || !on) return;

    const marker = new Marker({
      element: markerEl(),
      anchor: 'center',
      rotationAlignment: 'map',
      pitchAlignment: 'map',
    });
    const beam = marker.getElement().querySelector('.ul-beam') as SVGElement | null;
    let added = false;
    let recentered = false;

    const setHeading = (deg: number) => {
      marker.setRotation(deg);
      if (beam) beam.style.display = '';
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude: lng, latitude: lat, heading } = pos.coords;
        marker.setLngLat([lng, lat]);
        if (!added) {
          marker.addTo(map);
          added = true;
        }
        if (!recentered) {
          map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 17), essential: true });
          recentered = true;
        }
        // coords.heading is only present while moving; the compass below is preferred.
        if (heading != null && !Number.isNaN(heading)) setHeading(heading);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('[user-location]', err);
        if (err.code === err.PERMISSION_DENIED) {
          window.alert('Location permission is needed to show your position.');
          setOn(false);
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15_000 },
    );

    const onOrient = (e: Event) => {
      const ev = e as CompassEvent;
      let h: number | null = null;
      if (typeof ev.webkitCompassHeading === 'number') h = ev.webkitCompassHeading; // iOS, from north
      else if (ev.absolute && ev.alpha != null) h = 360 - ev.alpha; // Android absolute
      if (h != null && !Number.isNaN(h)) setHeading(((h % 360) + 360) % 360);
    };
    window.addEventListener('deviceorientationabsolute', onOrient);
    window.addEventListener('deviceorientation', onOrient);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientationabsolute', onOrient);
      window.removeEventListener('deviceorientation', onOrient);
      marker.remove();
    };
  }, [map, on]);

  const toggle = async () => {
    if (on) {
      setOn(false);
      return;
    }
    // iOS 13+ requires requesting orientation permission from a user gesture.
    const doe = window.DeviceOrientationEvent as unknown as OrientationPermissionApi | undefined;
    if (doe && typeof doe.requestPermission === 'function') {
      try {
        await doe.requestPermission();
      } catch {
        /* heading just won't show; position still works */
      }
    }
    setOn(true);
  };

  return (
    <IconButton
      label={on ? 'Hide my location' : 'Show my location'}
      onClick={toggle}
      disabled={!map}
      className={cn('rounded-full text-accent', on && 'bg-paper')}
    >
      <LocateIcon size={16} />
    </IconButton>
  );
}
