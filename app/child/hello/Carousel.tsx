"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { useCalm } from "@/child/ui/useCalm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { play } from "@/child/ui/sound";
import styles from "./onboarding.module.css";

/**
 * A stage carousel for the onboarding pickers (D-069): the centred item is big (the choice or the one
 * being explored), neighbours peek in smaller at the sides. Swipe, tap a neighbour, use the arrows or
 * the dots, or the arrow keys. It wraps around, never auto-scrolls, and follows the reading direction
 * (Arabic moves the other way; the art itself is never mirrored).
 */
export function Carousel<T extends string>({
  items,
  index,
  onIndex,
  render,
  label,
  itemLabel,
  rtl,
  prevLabel,
  nextLabel,
  spacing,
  reach = 1,
  testId,
}: {
  items: readonly T[];
  index: number;
  onIndex: (i: number) => void;
  render: (item: T, centre: boolean) => ReactNode;
  label: string;
  itemLabel: (item: T) => string;
  rtl: boolean;
  prevLabel: string;
  nextLabel: string;
  /** Distance between neighbours, as a share of the track width (e.g. 0.3). */
  spacing: number;
  /** How many neighbours show on each side. */
  reach?: 1 | 2;
  testId?: string;
}) {
  const reduce = useCalm();
  const n = items.length;
  const drag = useRef<{ x: number; id: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const go = (to: number) => {
    const i = ((to % n) + n) % n;
    if (i === index) return;
    play("step");
    onIndex(i);
  };
  const step = (d: 1 | -1) => go(index + d);

  // Shortest signed distance from the centre, so wrapping looks natural.
  const offset = (i: number) => {
    let o = i - index;
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
    return o;
  };

  const onPointerDown = (e: PointerEvent) => {
    drag.current = { x: e.clientX, id: e.pointerId };
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) < 40) return;
    // Swiping toward the reading start brings the next item in.
    step((dx < 0) !== rtl ? 1 : -1);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") step(rtl ? -1 : 1);
    else if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
    else return;
    e.preventDefault();
  };

  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 26 };

  return (
    <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label={label} data-testid={testId}>
      <button type="button" className={styles.arrow} onClick={() => step(-1)} aria-label={prevLabel} data-side="start">
        <Prev size={40} strokeWidth={3} aria-hidden />
      </button>

      <div ref={trackRef} className={styles.track} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (drag.current = null)} onKeyDown={onKey}>
        {items.map((item, i) => {
          const o = offset(i);
          const shown = Math.abs(o) <= reach;
          const centre = o === 0;
          return (
            <motion.button
              key={item}
              type="button"
              className={styles.slide}
              data-centre={centre || undefined}
              aria-label={itemLabel(item)}
              aria-current={centre || undefined}
              tabIndex={centre ? 0 : -1}
              aria-hidden={!shown || undefined}
              onClick={() => (centre ? undefined : go(i))}
              initial={false}
              animate={{
                x: (rtl ? -o : o) * spacing * width,
                scale: centre ? 1 : Math.abs(o) === 1 ? 0.6 : 0.42,
                opacity: shown ? (centre ? 1 : Math.abs(o) === 1 ? 0.85 : 0.35) : 0,
                zIndex: 10 - Math.abs(o),
              }}
              transition={spring}
              style={{ pointerEvents: shown ? "auto" : "none" }}
              data-testid={`slide-${item}`}
            >
              {render(item, centre)}
            </motion.button>
          );
        })}
      </div>

      <button type="button" className={styles.arrow} onClick={() => step(1)} aria-label={nextLabel} data-side="end">
        <Next size={40} strokeWidth={3} aria-hidden />
      </button>

      <div className={styles.dots}>
        {items.map((item, i) => (
          <button key={item} type="button" className={styles.dot} aria-label={itemLabel(item)} aria-current={i === index || undefined} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  );
}
