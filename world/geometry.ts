// Path and camera geometry for the map (MAP.md). Pure and unit-tested. Path points are fractions of
// the map image; callers convert them to pixels with the image's displayed size before measuring.

export type Pt = readonly [number, number];

export function segmentLengths(points: readonly Pt[]): number[] {
  return points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
}

/** The sub-path between two indices (inclusive), in walking order (reversed when walking backwards). */
export function subPath(points: readonly Pt[], from: number, to: number): Pt[] {
  return from <= to ? points.slice(from, to + 1) : points.slice(to, from + 1).reverse();
}

/** Point at fraction t (0..1) of the polyline's total length. */
export function pointAt(points: readonly Pt[], t: number): Pt {
  if (points.length === 1) return points[0];
  const lens = segmentLengths(points);
  const total = lens.reduce((a, b) => a + b, 0);
  if (total === 0) return points[0];
  let d = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] === 0 ? 0 : Math.min(d / lens[i], 1);
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i][1] + (points[i + 1][1] - points[i][1]) * k];
    }
    d -= lens[i];
  }
  return points[points.length - 1];
}

/** On-screen horizontal direction at fraction t, to choose the walking-left or walking-right pose. */
export function facingAt(points: readonly Pt[], t: number): "left" | "right" {
  const a = pointAt(points, Math.max(0, t - 0.01));
  const b = pointAt(points, Math.min(1, t + 0.01));
  return b[0] < a[0] ? "left" : "right";
}

export function toPixels(points: readonly Pt[], w: number, h: number): Pt[] {
  return points.map(([x, y]) => [x * w, y * h] as const);
}

export type Size = { w: number; h: number };

/** Largest stage of the given aspect ratio that fits entirely inside the view (like object-fit: contain),
 *  so every place, sign and stone on the map is visible at the starting zoom (D-054). */
export function containSize(ratio: number, view: Size): Size {
  if (!view.w || !view.h || !ratio) return { w: 0, h: 0 };
  return view.w / view.h > ratio ? { w: view.h * ratio, h: view.h } : { w: view.w, h: view.w / ratio };
}

/** Clamps one axis: when the scaled stage is smaller than the view it is centred; when larger, it can
 *  pan but never past its own edges. */
function clampAxis(v: number, stageLen: number, viewLen: number) {
  const free = viewLen - stageLen;
  if (free >= 0) return free / 2;
  return Math.min(0, Math.max(free, v));
}

/** Clamps a pan offset (CSS translate of the scaled stage) so the map never drifts off screen. */
export function clampPan(x: number, y: number, s: number, stage: Size, view: Size) {
  return { x: clampAxis(x, stage.w * s, view.w), y: clampAxis(y, stage.h * s, view.h) };
}

/** Pan offset that centres a point (in unscaled stage pixels) in the viewport, clamped. */
export function centreOn(px: number, py: number, s: number, stage: Size, view: Size) {
  return clampPan(view.w / 2 - px * s, view.h / 2 - py * s, s, stage, view);
}
