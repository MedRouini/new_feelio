"use client";

import { useCallback, useEffect, useState } from "react";
import type { LoadingPhase } from "./LoadingScene";

// Loading timing for the whole child app (D-056):
// - MIN_MS: a scene that appears stays at least this long, so it never flickers.
// - SLOW_MS: after this, the caption reassures ("Almost there…").
// - A failure shows the "problem" phase with a retry, never an error.
export const MIN_MS = 650;
export const SLOW_MS = 5000;

export type LoadState<T> = { phase: LoadingPhase | "ready"; data: T | null; retry: () => void };

/** Runs `task` (again when `key` changes or on retry) and reports the loading phase. */
export function useLoad<T>(task: () => Promise<T>, key: string, opts: { minMs?: number; slowMs?: number } = {}): LoadState<T> {
  const minMs = opts.minMs ?? MIN_MS;
  const slowMs = opts.slowMs ?? SLOW_MS;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ for: string; phase: LoadingPhase | "ready"; data: T | null }>({ for: "", phase: "loading", data: null });
  const runKey = `${key}#${attempt}`;

  useEffect(() => {
    let alive = true;
    const slow = setTimeout(() => alive && setResult((r) => (r.for === runKey ? r : { for: runKey, phase: "slow", data: null })), slowMs);
    Promise.all([task(), new Promise((r) => setTimeout(r, minMs))])
      .then(([data]) => alive && setResult({ for: runKey, phase: "ready", data }))
      .catch(() => alive && setResult({ for: runKey, phase: "problem", data: null }));
    return () => {
      alive = false;
      clearTimeout(slow);
    };
    // `task` is intentionally not a dependency: callers re-run by changing `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, minMs, slowMs]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  // A new key or attempt is "loading" until its own result arrives.
  if (result.for !== runKey) return { phase: "loading", data: null, retry };
  return { phase: result.phase, data: result.data, retry };
}

/** Resolves when the images are downloaded and decoded (so they appear whole, not line by line). */
export function preloadImages(srcs: string[]): Promise<void> {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => (img.decode ? img.decode().then(() => resolve(), () => resolve()) : resolve());
          img.onerror = () => reject(new Error("image failed"));
          img.src = src;
        }),
    ),
  ).then(() => undefined);
}
