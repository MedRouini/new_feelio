"use client";

import type { ReactNode } from "react";
import { play } from "./sound";
import { canPress, pressAttrs } from "./press";
import styles from "./pressable.module.css";

/**
 * Everyday controls in the child app (D-075): a chunky rounded square sitting on a solid base layer that
 * it sinks into when pressed. No shadow, no pill. Round for icon-only controls, wide with a word.
 */
export function Pressable({
  label,
  icon,
  shape = "wide",
  tone = "plain",
  href,
  onPress,
  selected,
  current,
  loading,
  disabled,
  showLabel = shape === "wide",
  className,
  testId,
  children,
}: {
  label: string;
  icon?: ReactNode;
  shape?: "round" | "wide";
  tone?: "primary" | "plain" | "night";
  href?: string;
  onPress?: () => void;
  selected?: boolean;
  current?: "step" | "page" | true;
  loading?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
  testId?: string;
  children?: ReactNode;
}) {
  const state = { loading, disabled, selected };
  const inner = (
    <span className={styles.face}>
      {loading ? (
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
      ) : (
        <>
          {icon}
          {children}
          {showLabel ? <span className={styles.word}>{label}</span> : null}
        </>
      )}
    </span>
  );
  const common = {
    className: [styles.pressable, className].filter(Boolean).join(" "),
    "data-shape": shape,
    "data-tone": tone,
    "aria-label": showLabel ? undefined : label,
    "aria-current": current,
    "data-testid": testId,
    ...pressAttrs(state),
  };
  if (href)
    return (
      <a href={href} {...common} onClick={() => play("tap")}>
        {inner}
      </a>
    );
  return (
    <button
      type="button"
      {...common}
      aria-pressed={selected === undefined ? undefined : selected}
      onClick={() => {
        if (!canPress(state)) return;
        play("tap");
        onPress?.();
      }}
    >
      {inner}
    </button>
  );
}
