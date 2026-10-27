"use client";

import { useEffect, useRef } from "react";
import audioIndex from "@/design/audio-index.generated.json";

/** Whether a pre-recorded line exists for this language (Arabic waits for an Arabic voice, D-064). */
export const hasLine = (locale: "en" | "ar", key: string) => (audioIndex as Record<string, string[]>)[locale]?.includes(key) ?? false;

/**
 * Plays one of Feelio's pre-recorded lines (D-037) when `cue` changes, and pauses or resumes it with
 * `playing`, so a paused activity is silent too (D-076). Without the audio file the caption alone speaks.
 */
export function useLine(key: string | null, locale: "en" | "ar", playing: boolean, cue: unknown) {
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!key || !hasLine(locale, key)) return;
    const a = new Audio(`/audio/${locale}/${key}.mp3`);
    audio.current = a;
    void a.play().catch(() => undefined);
    return () => {
      a.pause();
      if (audio.current === a) audio.current = null;
    };
    // `cue` replays the same line on a new step (each breath has its own step)
  }, [key, locale, cue]);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (!playing) a.pause();
    else if (a.paused && !a.ended && a.currentTime > 0) void a.play().catch(() => undefined);
  }, [playing]);
}
