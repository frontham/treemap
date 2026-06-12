/**
 * Similarity (translate + rotate + scale) transform of a lng/lat point, used to
 * manually re-georeference a whole layer of points.
 *
 * The transform is defined in a local metric frame centred on `pivot`:
 *   - x axis = east  (metres), y axis = north (metres)
 *   - scale about the pivot by `scale` (1 = unchanged)
 *   - rotate by `angleDeg` (counter-clockwise positive) about the pivot
 *   - then translate by (dx east, dy north) metres
 *
 * Scale and rotation share the same pivot so their order doesn't matter. The
 * SAME function runs in the live map preview (client) and the persist mutation
 * (server) so "what you see" is exactly "what gets saved".
 */
export type RigidParams = {
  dx: number; // metres east (+) / west (−)
  dy: number; // metres north (+) / south (−)
  angleDeg: number; // counter-clockwise degrees
  scale: number; // 1 = unchanged, 1.02 = +2 %
  pivotLng: number;
  pivotLat: number;
};

export const M_PER_DEG_LAT = 111_320;

export function applyRigid(lng: number, lat: number, p: RigidParams): [number, number] {
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((p.pivotLat * Math.PI) / 180);
  // to local metres relative to pivot
  const x = (lng - p.pivotLng) * mPerDegLng;
  const y = (lat - p.pivotLat) * M_PER_DEG_LAT;
  // scale + rotate about pivot, then translate
  const th = (p.angleDeg * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const xr = p.scale * (x * c - y * s) + p.dx;
  const yr = p.scale * (x * s + y * c) + p.dy;
  // back to lng/lat
  return [p.pivotLng + xr / mPerDegLng, p.pivotLat + yr / M_PER_DEG_LAT];
}

/** True when the params are an identity transform (nothing to preview/save). */
export function isIdentity(p: { dx: number; dy: number; angleDeg: number; scale: number }): boolean {
  return p.dx === 0 && p.dy === 0 && p.angleDeg === 0 && p.scale === 1;
}

/** Metres between two lng/lat points in the local frame around `pivotLat`. */
export function metresBetween(
  a: [number, number],
  b: [number, number],
  pivotLat: number,
): number {
  const mLng = M_PER_DEG_LAT * Math.cos((pivotLat * Math.PI) / 180);
  return Math.hypot((a[0] - b[0]) * mLng, (a[1] - b[1]) * M_PER_DEG_LAT);
}

/**
 * Closed-form 2D similarity (Procrustes) fit: the translate+rotate+scale that
 * best maps `from` points onto `to` points (both lng/lat), returned as
 * RigidParams about `pivot`. Needs ≥ 2 pairs. With exactly 2 it's exact; with
 * more it's least-squares. Feed it into applyRigid to move the rest of the set.
 */
export type RobustFit = {
  params: RigidParams;
  /** Residual (metres) per input pair, by index, under the final params. */
  residuals: number[];
  /** Indices of the pairs that survived outlier rejection. */
  inliers: Set<number>;
  /** Median residual (metres) over the inliers. */
  medianResidual: number;
};

/**
 * solveSimilarity with iterative outlier rejection, so one badly placed pair
 * doesn't skew the fit: solve, drop pairs whose residual exceeds
 * max(3 × median, 2 m), and re-solve (≤ 6 rounds). Needs ≥ 2 pairs.
 */
export function solveRobustSimilarity(
  from: Array<[number, number]>,
  to: Array<[number, number]>,
  pivotLng: number,
  pivotLat: number,
): RobustFit | null {
  const n = from.length;
  if (n < 2) return null;
  const resid = (p: RigidParams, i: number) =>
    metresBetween(applyRigid(from[i]![0], from[i]![1], p), to[i]!, pivotLat);
  const solveFor = (idx: number[]) =>
    solveSimilarity(
      idx.map((i) => from[i]!),
      idx.map((i) => to[i]!),
      pivotLng,
      pivotLat,
    );

  let idx = Array.from({ length: n }, (_, i) => i);
  let params = solveFor(idx);
  for (let it = 0; it < 6; it++) {
    params = solveFor(idx);
    const sorted = idx.map((i) => resid(params, i)).sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const keep = Array.from({ length: n }, (_, i) => i).filter(
      (i) => resid(params, i) < Math.max(3 * med, 2),
    );
    if (keep.length === idx.length || keep.length < 2) break;
    idx = keep;
  }
  params = solveFor(idx);

  const residuals = Array.from({ length: n }, (_, i) => resid(params, i));
  const inlierRes = idx.map((i) => residuals[i]!).sort((a, b) => a - b);
  return {
    params,
    residuals,
    inliers: new Set(idx),
    medianResidual: inlierRes[Math.floor(inlierRes.length / 2)] ?? 0,
  };
}

export function solveSimilarity(
  from: Array<[number, number]>,
  to: Array<[number, number]>,
  pivotLng: number,
  pivotLat: number,
): RigidParams {
  const mLng = M_PER_DEG_LAT * Math.cos((pivotLat * Math.PI) / 180);
  const toLocal = (p: [number, number]): [number, number] => [
    (p[0] - pivotLng) * mLng,
    (p[1] - pivotLat) * M_PER_DEG_LAT,
  ];
  const a = from.map(toLocal);
  const b = to.map(toLocal);
  const n = a.length;
  const ma: [number, number] = [0, 0];
  const mb: [number, number] = [0, 0];
  for (let i = 0; i < n; i++) {
    ma[0] += a[i]![0]; ma[1] += a[i]![1];
    mb[0] += b[i]![0]; mb[1] += b[i]![1];
  }
  ma[0] /= n; ma[1] /= n; mb[0] /= n; mb[1] /= n;
  let dot = 0;
  let cross = 0;
  let varA = 0;
  for (let i = 0; i < n; i++) {
    const ax = a[i]![0] - ma[0];
    const ay = a[i]![1] - ma[1];
    const bx = b[i]![0] - mb[0];
    const by = b[i]![1] - mb[1];
    dot += ax * bx + ay * by;
    cross += ax * by - ay * bx;
    varA += ax * ax + ay * ay;
  }
  const theta = Math.atan2(cross, dot);
  const scale = varA > 0 ? Math.hypot(dot, cross) / varA : 1;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const dx = mb[0] - scale * (c * ma[0] - s * ma[1]);
  const dy = mb[1] - scale * (s * ma[0] + c * ma[1]);
  return { dx, dy, angleDeg: (theta * 180) / Math.PI, scale, pivotLng, pivotLat };
}
