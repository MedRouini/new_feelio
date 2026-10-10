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

/** Smallest stage scale that still covers the viewport (no empty edges). */
export function coverScale(stage: Size, view: Size): number {
  return Math.max(view.w / stage.w, view.h / stage.h);
}

/** Clamps a pan offset (CSS translate of the scaled stage) so the image always covers the viewport. */
export function clampPan(x: number, y: number, s: number, stage: Size, view: Size) {
  const minX = Math.min(0, view.w - stage.w * s);
  const minY = Math.min(0, view.h - stage.h * s);
  return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
}

/** Pan offset that centres a point (in unscaled stage pixels) in the viewport, clamped. */
export function centreOn(px: number, py: number, s: number, stage: Size, view: Size) {
  return clampPan(view.w / 2 - px * s, view.h / 2 - py * s, s, stage, view);
}
