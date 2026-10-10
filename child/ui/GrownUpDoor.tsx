"use client";

import { useRef, useState } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import styles from "./ui.module.css";

const HOLD_MS = 2000;

/**
 * The way to the grown-up area from a child screen (DESIGN_SYSTEM §5): a small door in the corner that
 * opens only after a 2-second press-and-hold, so it is never the child's main action. It only leads to
 * the dashboard's sign-in and password gate; it grants nothing by itself.
 */
export function GrownUpDoor({ href, label }: { href: string; label: string }) {
  const [p, setP] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  // Uses the requestAnimationFrame timestamp (start.current === -1 means "set on the first frame").
  const tick = (now: number) => {
    if (start.current === null) return;
    if (start.current < 0) start.current = now;
    const k = Math.min((now - start.current) / HOLD_MS, 1);
    setP(k);
    if (k >= 1) {
      start.current = null;
      window.location.assign(href);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };
  const begin = () => {
    start.current = -1;
    raf.current = requestAnimationFrame(tick);
  };
  const cancel = () => {
    start.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    setP(0);
  };

  return (
    <button
      type="button"
      className={styles.door}
      aria-label={label}
      data-testid="grownup-door"
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && start.current === null) begin();
      }}
      onKeyUp={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <AssetImage id="ui_grownup_door" alt="" sizes="64px" />
      <span className={styles.doorRing} style={{ ["--p" as string]: p }} aria-hidden />
    </button>
  );
}
