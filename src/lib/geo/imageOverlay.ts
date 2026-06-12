import { M_PER_DEG_LAT } from './rigidTransform';

export type Pt = [number, number];
export type LngLatCorners = [Pt, Pt, Pt, Pt];
export type LatLng = { lng: number; lat: number };

/**
 * Editable transform of a reference image on the map: a centre, a uniform
 * scale, a rotation, and the unscaled half-extents in metres. Pure data —
 * `corners()` projects it to the lng/lat quad MapLibre's image source wants.
 */
export type OverlayTransform = {
  center: Pt;
  scale: number;
  rotDeg: number;
  baseHalfWm: number;
  baseHalfHm: number;
};

/** Metres per degree of longitude at the given latitude. */
export const mPerDegLng = (lat: number) => M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

/** The image's four lng/lat corners ([TL, TR, BR, BL]) for its current transform. */
export function corners(st: OverlayTransform): LngLatCorners {
  const mLng = mPerDegLng(st.center[1]);
  const hw = st.baseHalfWm * st.scale;
  const hh = st.baseHalfHm * st.scale;
  const th = (st.rotDeg * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const local: Pt[] = [
    [-hw, hh],
    [hw, hh],
    [hw, -hh],
    [-hw, -hh],
  ];
  return local.map(([x, y]) => {
    const rx = x * c - y * s;
    const ry = x * s + y * c;
    return [st.center[0] + rx / mLng, st.center[1] + ry / M_PER_DEG_LAT] as Pt;
  }) as LngLatCorners;
}

/**
 * Inverse of `corners()`: rebuild an editable transform from a saved overlay's
 * four lng/lat corners ([TL, TR, BR, BL]) so a stored overlay can be moved/
 * resized exactly like a freshly dropped image. baseHalf*m carry the on-map
 * dimensions with scale reset to 1, so the resize handle keeps the stored
 * aspect ratio.
 */
export function transformFromCorners(
  cs: readonly [LatLng, LatLng, LatLng, LatLng],
): OverlayTransform {
  const [tl, tr, br, bl] = cs;
  const centerLng = (tl.lng + br.lng) / 2;
  const centerLat = (tl.lat + br.lat) / 2;
  const mLng = mPerDegLng(centerLat);
  const toM = (p: LatLng): Pt => [(p.lng - centerLng) * mLng, (p.lat - centerLat) * M_PER_DEG_LAT];
  const tlM = toM(tl);
  const trM = toM(tr);
  const blM = toM(bl);
  const widthAxis: Pt = [trM[0] - tlM[0], trM[1] - tlM[1]]; // R(rot)·(2·halfW, 0)
  const heightAxis: Pt = [tlM[0] - blM[0], tlM[1] - blM[1]]; // R(rot)·(0, 2·halfH)
  const baseHalfWm = Math.max(1, Math.hypot(widthAxis[0], widthAxis[1]) / 2);
  const baseHalfHm = Math.max(1, Math.hypot(heightAxis[0], heightAxis[1]) / 2);
  const rotDeg = (Math.atan2(widthAxis[1], widthAxis[0]) * 180) / Math.PI;
  return { center: [centerLng, centerLat], scale: 1, rotDeg, baseHalfWm, baseHalfHm };
}

/** Rotate-handle position: 25% beyond the top-edge midpoint, along the image's up-axis (so it tracks rotation + size). */
export function rotateHandlePos(st: OverlayTransform): Pt {
  const cs = corners(st);
  const topMidLng = (cs[0][0] + cs[1][0]) / 2;
  const topMidLat = (cs[0][1] + cs[1][1]) / 2;
  return [
    st.center[0] + (topMidLng - st.center[0]) * 1.25,
    st.center[1] + (topMidLat - st.center[1]) * 1.25,
  ];
}

/** Uniform scale implied by dragging the corner handle to `ll` (resize, rotation locked). */
export function scaleFromPointer(st: OverlayTransform, ll: LatLng): number {
  const px = (ll.lng - st.center[0]) * mPerDegLng(st.center[1]);
  const py = (ll.lat - st.center[1]) * M_PER_DEG_LAT;
  return Math.max(0.02, Math.hypot(px, py) / Math.hypot(st.baseHalfWm, st.baseHalfHm));
}

/** Rotation implied by dragging the rotate handle to `ll` — aligns the image's
 *  up-axis to the pointer, like grabbing a clock hand (scale kept). */
export function rotationFromPointer(st: OverlayTransform, ll: LatLng): number {
  const px = (ll.lng - st.center[0]) * mPerDegLng(st.center[1]);
  const py = (ll.lat - st.center[1]) * M_PER_DEG_LAT;
  return (Math.atan2(py, px) * 180) / Math.PI - 90;
}
