"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/asset-ids";
import { play } from "./sound";
import { canPress, pressAttrs } from "./press";
import styles from "./actionObject.module.css";

/**
 * The few big actions in the child app (D-075): a tappable illustrated object with a short label plate.
 * Ready glows, loading wobbles, resting shows a moon and still answers (Feelio says why).
 */
export function ActionObject({
  art,
  label,
  href,
  onPress,
  ready,
  loading,
  loadingLabel,
  resting,
  sizes,
  className,
  testId,
}: {
  art: AssetId;
  label: string;
  href?: string;
  onPress?: () => void;
  ready?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  resting?: boolean;
  sizes: string;
  className?: string;
  testId?: string;
}) {
  const [pop, setPop] = useState(0);
  const state = { loading, resting };
  const inner = (
    <>
      <span key={pop} className={styles.object} data-pop={pop ? true : undefined}>
        <AssetImage id={art} alt="" sizes={sizes} className={styles.art} />
        {resting ? (
          <span className={styles.moon} aria-hidden>
            <Moon size={22} strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span className={styles.plate}>{loading && loadingLabel ? loadingLabel : label}</span>
    </>
  );
  const common = {
    className: [styles.action, className].filter(Boolean).join(" "),
    "data-ready": ready || undefined,
    "data-testid": testId,
    ...pressAttrs(state),
  };
  if (href && !resting)
    return (
      <a
        href={href}
        {...common}
        onClick={() => {
          play("pick");
          setPop((p) => p + 1);
        }}
      >
        {inner}
      </a>
    );
  return (
    <button
      type="button"
      {...common}
      onClick={() => {
        if (!canPress(state)) return;
        play(resting ? "tap" : "pick");
        setPop((p) => p + 1);
        onPress?.();
      }}
    >
      {inner}
    </button>
  );
}
