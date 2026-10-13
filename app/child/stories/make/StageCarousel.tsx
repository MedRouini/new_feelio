"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChoiceDisc } from "@/child/ui/ChoiceDisc";
import { Pressable } from "@/child/ui/Pressable";
import { isTap, keyStep, offsetFrom, pickOnTap, swipeStep, wrap } from "@/child/ui/carousel";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import type { AssetId } from "@/design/asset-ids";
import styles from "./stageCarousel.module.css";

export type StageItem = { id: string; word: string; art: AssetId | null };

/**
 * The theatre's carousel (D-075): choices on stage-light discs along the front of the stage. Swipe or
 * drag, the arrow pressables or the arrow keys move it; tapping a side disc brings it to the middle;
 * tapping the middle (or its "Choose" plate, or Enter) picks it. A drag never counts as a tap.
 */
export function StageCarousel({
  items,
  index,
  onIndex,
  onPick,
  label,
  prevLabel,
  nextLabel,
  chooseLabel,
  rtl,
  selectedId,
  trackRef,
  testId,
}: {
  items: StageItem[];
  index: number;
  onIndex: (i: number) => void;
  onPick: (item: StageItem) => void;
  label: string;
  prevLabel: string;
  nextLabel: string;
  chooseLabel: string;
  rtl: boolean;
  selectedId?: string;
  trackRef?: React.RefObject<HTMLDivElement | null>;
  testId?: string;
}) {
  const calm = useCalm();
  const n = items.length;
  const own = useRef<HTMLDivElement>(null);
  const track = trackRef ?? own;
  const press = useRef<{ x: number; y: number; id: number } | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el); // the observer reports the first size itself
    return () => ro.disconnect();
  }, [track]);
  const go = (to: number) => {
    const i = wrap(to, n);
    if (i === index) return;
    play("step");
    onIndex(i);
  };
  const step = (d: 1 | -1) => go(index + d);
  const centre = items[index];

  const down = (e: PointerEvent) => (press.current = { x: e.clientX, y: e.clientY, id: e.pointerId });
  const up = (e: PointerEvent, tapped?: number) => {
    const p = press.current;
    press.current = null;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!isTap(dx, dy)) {
      const s = swipeStep(dx, rtl);
      if (s) step(s);
      return;
    }
    if (tapped === undefined) return;
    if (pickOnTap(tapped, index) === "pick") onPick(items[tapped]);
    else go(tapped);
  };
  const key = (e: KeyboardEvent) => {
    const s = keyStep(e.key, rtl);
    if (s) {
      e.preventDefault();
      step(s);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick(centre);
    }
  };
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const spring = calm ? { duration: 0 } : { type: "spring" as const, stiffness: 280, damping: 28 };
  /** Where a neighbour sits: beside the middle disc, never on top of it (a share of the track width). */
  const spacing = Math.min(0.36, 175 / Math.max(width, 1));

  return (
    <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label={label} data-testid={testId}>
      <Pressable shape="round" tone="plain" label={prevLabel} icon={<Prev size={34} strokeWidth={3} aria-hidden />} onPress={() => step(-1)} className={styles.prev} testId="carousel-prev" />
      <div
        ref={track}
        className={styles.track}
        tabIndex={0}
        aria-label={`${label}: ${centre.word}`}
        onKeyDown={key}
        onPointerDown={down}
        onPointerUp={(e) => up(e)}
        onPointerCancel={() => (press.current = null)}
        data-testid="carousel-track"
      >
        {items.map((it, i) => {
          const o = offsetFrom(i, index, n);
          const shown = Math.abs(o) <= 1;
          const mid = o === 0;
          return (
            <motion.button
              key={it.id}
              type="button"
              tabIndex={-1}
              className={styles.slide}
              data-centre={mid || undefined}
              aria-hidden={!shown || undefined}
              aria-label={it.word}
              onPointerDown={(e) => {
                e.stopPropagation();
                down(e);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                up(e, i);
              }}
              onClick={(e) => {
                // keyboard or assistive activation (no pointer): the same rule as a tap
                if (e.detail !== 0) return;
                if (mid) onPick(it);
                else go(i);
              }}
              initial={false}
              animate={{
                x: (rtl ? -o : o) * spacing * width,
                scale: mid ? 1 : 0.58,
                opacity: shown ? (mid ? 1 : 0.85) : 0,
                zIndex: 10 - Math.abs(o),
              }}
              transition={spring}
              style={{ pointerEvents: shown ? "auto" : "none" }}
              data-testid={`slide-${it.id}`}
            >
              <ChoiceDisc art={it.art} word={it.word} selected={it.id === selectedId} size={mid ? "lg" : "md"} />
            </motion.button>
          );
        })}
      </div>
      <Pressable shape="round" tone="plain" label={nextLabel} icon={<Next size={34} strokeWidth={3} aria-hidden />} onPress={() => step(1)} className={styles.next} testId="carousel-next" />
      <div className={styles.under}>
        <span className={styles.name}>{centre.word}</span>
        <Pressable tone="primary" label={chooseLabel} onPress={() => onPick(centre)} testId="choose-this" />
      </div>
    </div>
  );
}
