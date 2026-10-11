"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const noSubscribe = () => () => {};

/**
 * The child's reduced-motion preference, safe for server rendering: false while hydrating (the server
 * can't know it), then the real value. Using motion's hook directly in render makes the first client
 * render differ from the server HTML (a hydration mismatch).
 */
export function useCalm(): boolean {
  const reduce = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && reduce === true;
}
