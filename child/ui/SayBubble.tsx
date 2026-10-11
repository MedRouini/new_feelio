"use client";

import { useEffect, useRef } from "react";
import audioIndex from "@/design/audio-index.generated.json";
import { AssetImage } from "@/design/components/AssetImage";
import styles from "./ui.module.css";

/**
 * What the mascot says: the caption in the delivered speech-bubble frame, plus the pre-generated voice
 * line when it exists (D-037). Tap to hear it again. Lines without audio yet show the caption only.
 */
export function SayBubble({
  text,
  audioKey,
  locale,
  replayLabel,
  className,
}: {
  text: string;
  audioKey?: string;
  locale: "en" | "ar";
  replayLabel: string;
  className?: string;
}) {
  const hasAudio = !!audioKey && (audioIndex as Record<string, string[]>)[locale]?.includes(audioKey);
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (hasAudio) void ref.current?.play().catch(() => undefined);
  }, [hasAudio, audioKey, text]);

  return (
    <button
      type="button"
      className={[styles.say, className].filter(Boolean).join(" ")}
      // Long lines get a smaller size so they stay inside the bubble.
      data-length={text.length > 90 ? "long" : text.length > 55 ? "mid" : undefined}
      aria-label={`${replayLabel}: ${text}`}
      onClick={() => {
        if (ref.current) {
          ref.current.currentTime = 0;
          void ref.current.play().catch(() => undefined);
        }
      }}
    >
      <AssetImage id="ui_say_bubble" alt="" sizes="(orientation: portrait) 78vw, 640px" className={styles.sayFrame} />
      <span className={styles.sayText} aria-live="polite">
        {text}
      </span>
      {hasAudio ? <audio ref={ref} src={`/audio/${locale}/${audioKey}.mp3`} preload="auto" /> : null}
    </button>
  );
}
