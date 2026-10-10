"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { play } from "../sound";
import { LoadingScene, type LoadingContext } from "./LoadingScene";

/** How long the iris takes to cover the screen before navigating (matches loading.module.css). */
const IRIS_MS = 520;

/**
 * The one transition between child screens (D-056): the loading scene opens as a circle from the
 * tapped thing, then the app navigates. The next screen (or its route loading) shows the same scene
 * until it is ready, so the child sees one continuous moment.
 */
export function useTransitionTo(): [(href: string, opts: { context: LoadingContext; placeId?: string; from?: { x: number; y: number }; tint?: string }) => void, ReactNode] {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [overlay, setOverlay] = useState<ReactNode>(null);

  const go = (href: string, opts: { context: LoadingContext; placeId?: string; from?: { x: number; y: number }; tint?: string }) => {
    play("whoosh");
    setOverlay(<LoadingScene context={opts.context} placeId={opts.placeId} tint={opts.tint} enterFrom={opts.from ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }} />);
    router.prefetch(href);
    setTimeout(() => router.push(href), reduce ? 0 : IRIS_MS);
  };
  return [go, overlay];
}

/** Centre of the element that was tapped, for the iris. */
export function centreOf(el: Element | null): { x: number; y: number } | undefined {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
