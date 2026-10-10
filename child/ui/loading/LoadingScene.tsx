"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { LOADING_BEAT, LOADING_MASCOT, pick, pickOptional, placeArrival } from "@/design/asset-slots";
import { AssetImage } from "@/design/components/AssetImage";
import { Mascot } from "../Mascot";
import { play } from "../sound";
import styles from "./loading.module.css";

export type LoadingContext = "place" | "level" | "generic";
export type LoadingPhase = "loading" | "slow" | "problem";

/** Beat length in ms; also in loading.module.css (--beat). */
const BEAT_MS = 1200;

/**
 * The one loading screen of the child app (D-056, docs/LEVEL_FLOW.md §3). Every wait looks the same:
 * a flat backdrop, the mascot hopping, and the three brand companions bouncing in turn (the "working
 * on it" beat). The context only changes the details: the mascot's pose, an optional arrival picture
 * of the place, the caption and the backdrop colour.
 *
 * - `enterFrom`: screen point the scene opens from (an iris from the tapped thing). Omit it when the
 *   scene continues one already on screen, so the hand-over is invisible.
 * - `leaving`: fades the scene out over the content that has just loaded.
 * - phase "slow" reassures after a few seconds; "problem" shows the confused mascot and a retry,
 *   never an error message or the child's fault.
 */
export function LoadingScene({
  context,
  placeId,
  phase = "loading",
  caption,
  tint,
  enterFrom,
  leaving = false,
  onRetry,
  onLeft,
}: {
  context: LoadingContext;
  placeId?: string;
  phase?: LoadingPhase;
  caption?: string;
  tint?: string;
  enterFrom?: { x: number; y: number };
  leaving?: boolean;
  onRetry?: () => void;
  onLeft?: () => void;
}) {
  const t = useTranslations("child.loading");
  const ref = useRef<HTMLDivElement>(null);

  // Keep the beat in step across scenes (route hand-overs), so it never jumps when one replaces another.
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--beat-offset", `${-(performance.now() % BEAT_MS)}ms`);
  }, []);

  const problem = phase === "problem";
  const pose = pick(problem ? LOADING_MASCOT.problem : LOADING_MASCOT[context]);
  const arrival = context === "place" && placeId && !problem ? pickOptional(placeArrival(placeId)) : null;
  const text = problem ? t("problem") : phase === "slow" ? t("slow") : (caption ?? t(context));

  const style = {
    ...(tint ? { "--loading-bg": tint } : {}),
    ...(enterFrom ? { "--ix": `${enterFrom.x}px`, "--iy": `${enterFrom.y}px` } : {}),
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={[styles.scene, enterFrom ? styles.iris : "", leaving ? styles.leaving : ""].join(" ")}
      style={style}
      role="status"
      aria-busy={!problem}
      aria-live="polite"
      data-testid="loading"
      data-context={context}
      data-phase={phase}
      onAnimationEnd={(e) => {
        if (leaving && e.target === e.currentTarget) onLeft?.();
      }}
    >
      {arrival ? <AssetImage id={arrival} alt="" sizes="40vmin" className={styles.arrival} /> : null}
      <div className={problem ? styles.mascotStill : styles.mascot}>
        <Mascot pose={pose} label={text} sizes="30vmin" />
      </div>
      {problem ? null : (
        <div className={styles.beat} aria-hidden>
          {LOADING_BEAT.map((id) => (
            <AssetImage key={id} id={id} alt="" sizes="64px" className={styles.beatItem} />
          ))}
        </div>
      )}
      <p className={styles.caption}>{text}</p>
      {problem && onRetry ? (
        <button
          type="button"
          className={styles.retry}
          aria-label={t("retry")}
          onClick={() => {
            play("tap");
            onRetry();
          }}
          data-testid="loading-retry"
        >
          <RotateCcw size={40} strokeWidth={3} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
