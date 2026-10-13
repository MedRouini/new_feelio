// Carousel maths (D-075), pure: shared by the theatre carousel and its tests. The reading direction
// decides which way a swipe or an arrow key moves; the pictures themselves never mirror.
export const wrap = (i: number, n: number) => ((i % n) + n) % n;

export function offsetFrom(i: number, index: number, n: number): number {
  let o = i - index;
  if (o > n / 2) o -= n;
  if (o < -n / 2) o += n;
  return o;
}

/** Swiping toward the reading start brings the next item in. */
export function swipeStep(dx: number, rtl: boolean, threshold = 40): 1 | -1 | 0 {
  if (Math.abs(dx) < threshold) return 0;
  return (dx < 0) !== rtl ? 1 : -1;
}

export function keyStep(key: string, rtl: boolean): 1 | -1 | 0 {
  if (key === "ArrowRight") return rtl ? -1 : 1;
  if (key === "ArrowLeft") return rtl ? 1 : -1;
  return 0;
}

/** A press that moved less than this is a tap; more is a drag (never both). */
export const isTap = (dx: number, dy: number) => Math.hypot(dx, dy) < 12;

/** Tapping the settled middle picks it; tapping any other picture brings it to the middle. */
export const pickOnTap = (tapped: number, settled: number): "pick" | "centre" => (tapped === settled ? "pick" : "centre");
