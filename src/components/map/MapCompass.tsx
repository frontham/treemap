'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from './MapContext';
import { useT } from '@/lib/i18n/LocaleProvider';
import { cn } from '@/lib/cn';
import { colors } from '@/styles/tokens';

type PermissionDOE = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

/** Heading in degrees clockwise from true north, from a device-orientation event. */
function headingFromEvent(e: DeviceOrientationEvent): number | null {
  // iOS exposes the calibrated compass heading directly.
  const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
  if (typeof ios === 'number' && !Number.isNaN(ios)) return ios;
  // Absolute orientation elsewhere: alpha is counter-clockwise from north.
  if (e.absolute && typeof e.alpha === 'number') {
    const screenAngle =
      typeof screen !== 'undefined' && screen.orientation ? screen.orientation.angle : 0;
    return (360 - e.alpha + screenAngle) % 360;
  }
  return null;
}

/**
 * Small compass beside the coordinate readout. Click to follow the device
 * heading — the map rotates so the way you're facing is "up" — and click again
 * to snap back to north. The needle always points to true north as the map
 * rotates (whether from following or a manual two-finger rotate).
 */
export function MapCompass() {
  const { map } = useMap();
  const t = useT();
  const needleRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(false);

  // Keep the needle aimed at true north as the map rotates. Imperative (style on
  // a ref) so continuous rotation while following doesn't re-render React.
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

  // While following, drive the map bearing from the device heading — but
  // cooperatively. We smooth the heading (sensors are jittery) and apply it from
  // a rAF loop that *skips whenever the map is already moving* (a user pan/zoom
  // or a programmatic animation like "fly to my location"). That way the compass
  // never fights a gesture and never cancels an in-flight camera animation
  // (setBearing would otherwise stop it), which also keeps the location dot from
  // being swept off-screen.
  useEffect(() => {
    if (!map || !following) return;
    let target: number | null = null;
    let gotHeading = false;
    let raf = 0;

    const onOrient = (e: DeviceOrientationEvent) => {
      const heading = headingFromEvent(e);
      if (heading == null) return;
      gotHeading = true;
      if (target == null) target = heading;
      else {
        // Low-pass toward the new reading, shortest way round the circle.
        const d = ((heading - target + 540) % 360) - 180;
        target = (target + d * 0.5 + 360) % 360;
      }
    };
    const evt =
      'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evt, onOrient as EventListener, true);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (target == null || map.isMoving()) return;
      const cur = map.getBearing();
      const diff = ((target - cur + 540) % 360) - 180;
      if (Math.abs(diff) < 1) return; // deadband — don't churn while ~stationary
      map.setBearing(cur + diff * 0.25); // ease toward heading
    };
    raf = requestAnimationFrame(tick);

    // No reading arrives on devices without a compass (e.g. desktop) — back out.
    const timer = window.setTimeout(() => {
      if (!gotHeading) {
        setFollowing(false);
        window.alert(t('compass.unavailable'));
      }
    }, 2500);

    return () => {
      window.removeEventListener(evt, onOrient as EventListener, true);
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [map, following, t]);

  async function toggle() {
    if (!map) return;
    if (following) {
      setFollowing(false);
      map.easeTo({ bearing: 0, duration: 400 });
      return;
    }
    // iOS 13+ needs permission, requested from a user gesture (this click).
    const DOEvent = window.DeviceOrientationEvent as PermissionDOE | undefined;
    if (DOEvent && typeof DOEvent.requestPermission === 'function') {
      try {
        if ((await DOEvent.requestPermission()) !== 'granted') return;
      } catch {
        return;
      }
    }
    setFollowing(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('compass.label')}
      aria-pressed={following}
      title={t('compass.label')}
      className={cn(
        'pointer-events-auto absolute bottom-4 left-4 z-20 flex h-9 w-9 items-center justify-center',
        'rounded-full backdrop-blur-md hairline shadow-floating transition-colors',
        following ? 'bg-accent' : 'bg-panel/85 hover:bg-paper',
      )}
    >
      <div ref={needleRef} className="h-5 w-5">
        <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
          {/* North half (red-ish accent), south half muted; white while following. */}
          <polygon
            points="12,2.5 15.5,12 8.5,12"
            fill={following ? '#FFFFFF' : colors.accent}
          />
          <polygon
            points="12,21.5 15.5,12 8.5,12"
            fill={following ? 'rgba(255,255,255,0.55)' : colors.muted}
          />
        </svg>
      </div>
    </button>
  );
}
