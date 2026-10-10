"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/assets";
import { play } from "./sound";
import styles from "./ui.module.css";

export type MascotPose = Extract<AssetId, `mascot_${string}`>;

/**
 * The mascot in a scene (MASCOT.md, ARCHITECTURE §8). Renders one delivered pose. Idle breathing is a
 * CSS transform; the blink shows only the face area of mascot_idle_blink over mascot_idle (D-029).
 * Tapping always gives instant feedback (pop + sound). It is never mirrored.
 */
export function Mascot({
  pose,
  label,
  onTap,
  className,
  style,
  sizes = "40vmin",
}: {
  pose: MascotPose;
  label: string;
  onTap?: () => void;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
}) {
  const [blink, setBlink] = useState(false);
  const [popKey, setPopKey] = useState(0);

  useEffect(() => {
    if (pose !== "mascot_idle") return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        loop();
      }, 3000 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, [pose]);

  return (
    <button
      type="button"
      className={[styles.mascot, className].filter(Boolean).join(" ")}
      style={style}
      aria-label={label}
      data-pose={pose}
      onClick={() => {
        play("pop");
        setPopKey((k) => k + 1);
        onTap?.();
      }}
    >
      <span key={popKey} className={popKey ? styles.pop : undefined} style={{ display: "block" }}>
        <span className={styles.breathe} style={{ display: "block", position: "relative" }}>
          <AssetImage id={pose} alt="" sizes={sizes} className={styles.mascotImg} priority />
          {pose === "mascot_idle" ? (
            <span className={styles.mascotBlink} data-on={blink} aria-hidden>
              <AssetImage id="mascot_idle_blink" alt="" sizes={sizes} className={styles.mascotImg} />
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
