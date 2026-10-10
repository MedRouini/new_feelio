"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useGesture } from "@use-gesture/react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/child/ui/Avatar";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { SayBubble } from "@/child/ui/SayBubble";
import { play } from "@/child/ui/sound";
import uiStyles from "@/child/ui/ui.module.css";
import type { Avatar as AvatarChoice } from "@/child/options";
import { AssetImage } from "@/design/components/AssetImage";
import { isDelivered, type AssetId } from "@/design/assets";
import { centreOn, clampPan, containSize, facingAt, pointAt, subPath, toPixels, type Pt } from "@/world/geometry";
import type { World, WorldPlace } from "@/world/schema";
import type { WorldState } from "@/world/unlock";
import { centreOf, useTransitionTo } from "@/child/ui/loading/useTransitionTo";
import { ringStyle } from "@/world/ring";
import { useElementSize, useOrientation, useViewportSize } from "./useOrientation";
import styles from "./map.module.css";

const MAX_ZOOM = 2.5;
const PLACE_ZOOM = 1.8;
const WALK_PX_PER_S = 120;
const LAST_PLACE_KEY = "feelio.map.lastPlace"; // per-device convenience only (never needed for correctness)

type Props = {
  world: World;
  state: WorldState;
  locale: "en" | "ar";
  avatar: AvatarChoice;
  /** First map moment after onboarding: the characters walk in from the start of the path. */
  arriveFromStart?: boolean;
  onMascotTap?: () => void;
};

function readLastPlace(): string | null {
  try {
    return window.localStorage.getItem(LAST_PLACE_KEY);
  } catch {
    return null;
  }
}
function writeLastPlace(id: string) {
  try {
    window.localStorage.setItem(LAST_PLACE_KEY, id);
  } catch {
    // storage blocked: the map still works, it just won't animate the next unlock
  }
}

export function MapView({ world, state, locale, avatar, arriveFromStart, onMascotTap }: Props) {
  const t = useTranslations("child.map");
  const orientation = useOrientation();
  const screen = useViewportSize();
  // The map area: the whole screen (the glass dock floats over it, D-055).
  const [setViewportEl, vp] = useElementSize<HTMLDivElement>();
  const reduce = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const sayKey = useRef(0);

  const places = useMemo(() => [...world.places].sort((a, b) => a.order - b.order), [world]);
  const map = orientation ? world.maps[orientation] : null;
  const ratio = map ? map.size[0] / map.size[1] : 1.5;
  // Stage at scale 1 fits inside the map area, like object-fit: contain: the whole map is always
  // visible (D-054). Zooming in is optional; panning never goes past the map's edges.
  const stage = useMemo(() => containSize(ratio, vp), [vp, ratio]);
  const bindViewport = (el: HTMLDivElement | null) => {
    viewportRef.current = el;
    setViewportEl(el);
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const s = useMotionValue(1);
  const inv = useTransform(s, (v) => 1 / v);

  const [go, transition] = useTransitionTo();
  const [say, setSay] = useState<{ text: string; key: number } | null>(null);
  const [wobbleId, setWobbleId] = useState<{ id: string; n: number } | null>(null);
  const [pose, setPose] = useState<MascotPose>("mascot_marker");
  const [walking, setWalking] = useState(false);
  const markerX = useMotionValue(0);
  const markerY = useMotionValue(0);
  const markerLeft = useTransform(markerX, (v) => `${v * 100}%`);
  const markerTop = useTransform(markerY, (v) => `${v * 100}%`);

  const current = state.currentPlaceId;

  const sayLine = (text: string) => setSay({ text, key: ++sayKey.current });
  useEffect(() => {
    if (!say) return;
    const id = setTimeout(() => setSay(null), 6000);
    return () => clearTimeout(id);
  }, [say]);

  // Camera: centre on the current place whenever the map or the viewport changes.
  useEffect(() => {
    if (!map || !stage.w) return;
    const pad = map.places[current].pad;
    // stop any zoom still running (e.g. closing a place just before the screen turned)
    s.stop();
    x.stop();
    y.stop();
    s.set(1);
    const c = centreOn(pad.x * stage.w, pad.y * stage.h, 1, stage, vp);
    x.set(c.x);
    y.set(c.y);
  }, [map, stage, vp, current, s, x, y]);

  // Marker: stand on the current pad, or walk there along the path when a place was newly reached.
  useEffect(() => {
    if (!map || !stage.w) return;
    const target = map.places[current];
    const last = readLastPlace();
    const fromIndex = arriveFromStart ? 0 : last && last !== current && map.places[last] ? map.places[last].pathIndex : null;
    markerX.set(target.pad.x);
    markerY.set(target.pad.y);
    if (fromIndex === null || fromIndex === target.pathIndex || reduce) {
      writeLastPlace(current);
      return;
    }
    const path = subPath(map.path as Pt[], fromIndex, target.pathIndex);
    const px = toPixels(path, stage.w, stage.h);
    const length = px.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - px[i][0], p[1] - px[i][1]), 0);
    const [sx, sy] = pointAt(px, 0);
    markerX.set(sx / stage.w);
    markerY.set(sy / stage.h);
    let lastFacing: "left" | "right" | null = null;
    let controls: { stop: () => void } | null = null;
    // Start on the next frame, so state changes happen in a callback, not synchronously in the effect.
    const raf = requestAnimationFrame(() => {
      setWalking(true);
      controls = animate(0, 1, {
        duration: Math.min(Math.max(length / WALK_PX_PER_S, 1.2), 6),
        ease: "linear",
        onUpdate: (v) => {
          const [qx, qy] = pointAt(px, v);
          markerX.set(qx / stage.w);
          markerY.set(qy / stage.h);
          const f = facingAt(px, v);
          if (f !== lastFacing) {
            lastFacing = f;
            setPose(f === "left" ? "mascot_walking_left" : "mascot_walking_right");
          }
        },
        onComplete: () => {
          setWalking(false);
          play("unlock");
          setPose(isDelivered("mascot_excited") ? "mascot_excited" : "mascot_feel_excited");
          setTimeout(() => setPose("mascot_marker"), 1200);
          writeLastPlace(current);
        },
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      controls?.stop();
    };
  }, [map, stage, current, arriveFromStart, reduce, markerX, markerY]);

  // The part of the map not under the glass dock: zoomed places are centred in it (D-055).
  const focusHeight = () => {
    const dock = document.querySelector("[data-dock] > *");
    return dock ? Math.min(vp.h, dock.getBoundingClientRect().top) : vp.h;
  };

  const zoomTo = (px: number, py: number, scale: number) => {
    const c = centreOn(px, py, scale, stage, vp, focusHeight());
    const opts = reduce ? { duration: 0 } : { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] as const };
    animate(s, scale, opts);
    animate(x, c.x, opts);
    animate(y, c.y, opts);
  };

  const zoomAt = (clientX: number, clientY: number, next: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ox = clientX - r.left;
    const oy = clientY - r.top;
    const s0 = s.get();
    const s1 = Math.min(MAX_ZOOM, Math.max(1, next));
    const k = s1 / s0;
    const c = clampPan(ox - (ox - x.get()) * k, oy - (oy - y.get()) * k, s1, stage, vp);
    s.set(s1);
    x.set(c.x);
    y.set(c.y);
  };

  useGesture(
    {
      onPointerDown: () => {
        dragged.current = false;
      },
      onDrag: ({ offset: [ox, oy], movement: [mx, my], pinching, cancel }) => {
        if (pinching) return cancel();
        if (Math.hypot(mx, my) > 6) dragged.current = true;
        const c = clampPan(ox, oy, s.get(), stage, vp);
        x.set(c.x);
        y.set(c.y);
      },
      onPinch: ({ origin: [ox, oy], offset: [sc] }) => {
        dragged.current = true;
        zoomAt(ox, oy, sc);
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        zoomAt(event.clientX, event.clientY, s.get() * (1 - dy * 0.0015));
      },
    },
    {
      target: viewportRef,
      eventOptions: { passive: false },
      drag: { from: () => [x.get(), y.get()], filterTaps: true },
      pinch: { scaleBounds: { min: 1, max: MAX_ZOOM }, from: () => [s.get(), 0] },
    },
  );

  if (!map || !stage.w) {
    // Before mount the orientation (and the area's size) is unknown; render the meadow colour only.
    return <div ref={bindViewport} className={styles.viewport} aria-busy="true" />;
  }

  const assetId = (map.assets[locale] ?? map.assets.en) as AssetId;
  const placeName = (p: WorldPlace) => p.name[locale];
  const label = (p: WorldPlace) => {
    const st = state.places[p.id].state;
    const key = st === "locked" ? "placeLocked" : st === "current" ? "placeCurrent" : st === "completed" ? "placeDone" : "placeOpen";
    return `${t(key, { name: placeName(p) })}. ${p.alt[locale]}`;
  };

  const onPlace = (p: WorldPlace) => {
    if (dragged.current) return;
    const st = state.places[p.id].state;
    if (st === "locked") {
      play("pop");
      setWobbleId({ id: p.id, n: ++sayKey.current });
      const prev = places[places.findIndex((q) => q.id === p.id) - 1];
      sayLine(t("notYet", { place: prev ? placeName(prev) : placeName(places[0]) }));
      return;
    }
    // Open place: the camera leans in, and the place's own map opens through the loading scene (D-056).
    play("pick");
    const h = map.places[p.id].hotspot;
    zoomTo(h.x * stage.w, h.y * stage.h, PLACE_ZOOM);
    go(`/place/${p.id}`, { context: "place", placeId: p.id, from: centreOf(document.querySelector(`[data-place="${p.id}"]`)) });
  };

  const currentPad = map.places[current].pad;

  return (
    <>
      {/* Spare space around the fitted map is the art's own meadow colour (flat, from world data) */}
      <div className={styles.backdrop} style={{ background: map.backdrop }} aria-hidden />
      <div
        ref={bindViewport}
        className={styles.viewport}
        role="region"
        aria-label={t("mapLabel")}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <motion.div
          className={styles.stage}
          style={{ x, y, scale: s, width: stage.w, height: stage.h, ["--inv" as string]: inv }}
          data-orientation={orientation}
          data-fit={Math.abs(stage.w - vp.w) < 1 && Math.abs(stage.h - vp.h) < 1 ? "exact" : Math.abs(stage.w - vp.w) < 1 ? "width" : "height"}
        >
          <AssetImage id={assetId} alt="" sizes={`${Math.round(stage.w)}px`} className={styles.mapImg} priority />

          {/* glowing ring laid on the current place's stepping-stone rim (pad oval measured from the art) */}
          <span
            className={styles.ring}
            data-testid="map-ring"
            style={ringStyle(currentPad)}
          >
            <AssetImage id="ring_current" alt="" sizes="20vw" className={styles.ringImg} />
          </span>

          {places.map((p) => {
            const mp = map.places[p.id];
            const st = state.places[p.id].state;
            const wob = wobbleId?.id === p.id ? wobbleId.n : 0;
            return (
              <button
                key={`${p.id}-${wob}`}
                type="button"
                className={[styles.place, wob ? uiStyles.wobble : ""].join(" ")}
                data-state={st}
                data-place={p.id}
                aria-label={label(p)}
                style={{ left: `${mp.hotspot.x * 100}%`, top: `${mp.hotspot.y * 100}%`, width: `${mp.hotspot.r * 2 * 100}%` }}
                onClick={() => onPlace(p)}
                onDoubleClick={() => onPlace(p)}
              >
                {st === "locked" ? <AssetImage id="badge_lock" alt="" sizes="10vw" className={styles.badge} /> : null}
                {st === "completed" ? <AssetImage id="badge_star" alt="" sizes="10vw" className={styles.badge} /> : null}
              </button>
            );
          })}

          {/* Feelio and the child's character, standing on (or walking to) the current stone */}
          <motion.div className={styles.marker} style={{ left: markerLeft, top: markerTop }} data-testid="map-marker">
            <div className={styles.markerInner} style={{ ["--marker" as string]: `${Math.round(Math.min(screen.w, screen.h) * 0.16)}px` }}>
              <Mascot
                pose={pose}
                label={t("you")}
                className={styles.markerMascot}
                sizes="20vmin"
                onTap={() => {
                  if (!walking) onMascotTap?.();
                }}
              />
              <Avatar avatar={avatar} sizes="12vmin" className={[styles.markerAvatar, walking ? styles.hopping : ""].join(" ")} />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {transition}

      {say ? (
        <div className={styles.sayWrap} key={say.key}>
          <SayBubble text={say.text} locale={locale} replayLabel={t("close")} />
        </div>
      ) : null}
    </>
  );
}
