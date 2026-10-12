"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import audioIndex from "@/design/audio-index.generated.json";
import { AssetImage } from "@/design/components/AssetImage";
import { useCalm } from "./useCalm";
import styles from "./caption.module.css";

/**
 * What Feelio says, in the language of the place (redesign v2, docs/REDESIGN_V2.md). The line is heard
 * (pre-generated voice when it exists, D-037) and shown in a form that belongs to the page, instead of
 * the same speech bubble everywhere:
 * - "sign": painted on the approved wooden sign plate (the map and other in-world screens)
 * - "float": glowing words with no box, rising softly (Talk)
 * - "title": bold display words set right on the scene (the Story theatre, the library, the Collection)
 * Tap to hear it again. Changes of line cross-fade (a cut under reduced motion).
 */
export function Caption({
  text,
  audioKey,
  locale,
  replayLabel,
  variant,
  className,
  testId,
}: {
  text: string;
  audioKey?: string;
  locale: "en" | "ar";
  replayLabel: string;
  variant: "sign" | "float" | "title";
  className?: string;
  testId?: string;
}) {
  const calm = useCalm();
  const hasAudio = !!audioKey && (audioIndex as Record<string, string[]>)[locale]?.includes(audioKey);
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (hasAudio) void ref.current?.play().catch(() => undefined);
  }, [hasAudio, audioKey, text]);

  const length = text.length > 80 ? "long" : text.length > 40 ? "mid" : "short";
  return (
    <button
      type="button"
      className={[styles.caption, className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-length={length}
      aria-label={`${replayLabel}: ${text}`}
      data-testid={testId}
      onClick={() => {
        if (ref.current) {
          ref.current.currentTime = 0;
          void ref.current.play().catch(() => undefined);
        }
      }}
    >
      {variant === "sign" ? <AssetImage id="ui_sign_plate" alt="" sizes="(orientation: portrait) 80vw, 520px" className={styles.plate} /> : null}
      <span className={styles.board}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={text}
            className={styles.words}
            aria-live="polite"
            initial={calm ? { opacity: 0 } : { opacity: 0, y: variant === "float" ? 14 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={calm ? { opacity: 0 } : { opacity: 0, y: variant === "float" ? -14 : -4 }}
            transition={{ duration: calm ? 0.12 : 0.28, ease: "easeOut" }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
      {hasAudio ? <audio ref={ref} src={`/audio/${locale}/${audioKey}.mp3`} preload="auto" /> : null}
    </button>
  );
}
