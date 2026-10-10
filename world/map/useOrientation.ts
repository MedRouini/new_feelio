"use client";

import { useSyncExternalStore } from "react";
import type { Orientation } from "@/world/schema";

// Which map to show: by viewport shape, not the orientation API (unreliable in iOS PWAs).
const query = "(orientation: portrait)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  window.addEventListener("resize", cb);
  return () => {
    mq.removeEventListener("change", cb);
    window.removeEventListener("resize", cb);
  };
}

export function useOrientation(): Orientation | null {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(query).matches ? "vertical" : "horizontal"),
    () => null, // server: unknown until mounted, so nothing orientation-specific is rendered on the server
  );
}

function subscribeSize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

let lastSize = { w: 0, h: 0 };
export function useViewportSize(): { w: number; h: number } {
  return useSyncExternalStore(
    subscribeSize,
    () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w !== lastSize.w || h !== lastSize.h) lastSize = { w, h };
      return lastSize;
    },
    () => lastSize,
  );
}
