"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/assets";
import { play, type SoundRole } from "./sound";
import styles from "./ui.module.css";

/**
 * A delivered object you can touch (DESIGN_SYSTEM §5): it is a button because it looks like a thing,
 * not because it sits in a box. Every tap gives instant feedback: a squash-and-settle plus a sound.
 */
export function ThingButton({
  art,
  label,
  showLabel = false,
  pressed,
  onPress,
  sound = "tap",
  sizes,
  className,
  style,
  children,
  testId,
}: {
  art?: AssetId;
  label: string;
  showLabel?: boolean;
  pressed?: boolean;
  onPress: () => void;
  sound?: SoundRole;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  testId?: string;
}) {
  const [popKey, setPopKey] = useState(0);
  return (
    <button
      type="button"
      className={[styles.thing, className].filter(Boolean).join(" ")}
      style={style}
      aria-label={label}
      aria-pressed={pressed}
      data-testid={testId}
      onClick={() => {
        play(sound);
        setPopKey((k) => k + 1);
        onPress();
      }}
    >
      <span key={popKey} className={popKey ? styles.pop : undefined} style={{ display: "block", inlineSize: "100%" }}>
        {art ? <AssetImage id={art} alt="" sizes={sizes} className={styles.thingArt} /> : null}
        {children}
      </span>
      {showLabel ? <span className={styles.thingLabel}>{label}</span> : null}
    </button>
  );
}
