"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Orientation } from "@/world/schema";

// Which map to show: by viewport size, not the orientation API (unreliable in iOS PWAs). The vertical
// map is for phones held upright; from tablet width (768 px) up, and in any landscape view, the
// horizontal map is used (D-055).
const query = "(orientation: portrait) and (max-width: 767px)";

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

/** Live size of an element (e.g. the map area above the dock, whose bottom is set in CSS). */
export function useElementSize<T extends HTMLElement>(): [(el: T | null) => void, { w: number; h: number }] {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size];
}
