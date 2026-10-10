"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useGesture } from "@use-gesture/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/child/ui/Avatar";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { NameSign } from "@/child/ui/NameSign";
import { SayBubble } from "@/child/ui/SayBubble";
import { ThingButton } from "@/child/ui/ThingButton";
import { play } from "@/child/ui/sound";
import uiStyles from "@/child/ui/ui.module.css";
import type { Avatar as AvatarChoice } from "@/child/options";
import { AssetImage } from "@/design/components/AssetImage";
import { isDelivered, type AssetId } from "@/design/assets";
import { centreOn, clampPan, facingAt, pointAt, subPath, toPixels, type Pt } from "@/world/geometry";
import type { World, WorldPlace } from "@/world/schema";
import type { LevelState, WorldState } from "@/world/unlock";
import { useOrientation, useViewportSize } from "./useOrientation";
import styles from "./map.module.css";

const MAX_ZOOM = 2.5;
const PLACE_ZOOM = 1.8;
const WALK_PX_PER_S = 120;
/** Height of the dock at the bottom: the camera treats only the area above it as the visible map. */
const DOCK_H = 132;
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

const LEVEL_NODE: Record<LevelState, AssetId> = {
  locked: "node_locked",
  current: "node_current",
  open: "node_current",
  completed: "node_completed",
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
  // The part of the screen not covered by the dock; centring and panning use this.
  const vp = useMemo(() => ({ w: screen.w, h: Math.max(0, screen.h - DOCK_H) }), [screen]);
  const reduce = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const sayKey = useRef(0);

  const places = useMemo(() => [...world.places].sort((a, b) => a.order - b.order), [world]);
  const map = orientation ? world.maps[orientation] : null;
  const ratio = map ? map.size[0] / map.size[1] : 1.5;
  // Stage at scale 1 covers the viewport exactly (no empty edges), like object-fit: cover.
  const stage = useMemo(() => {
    if (!vp.w || !vp.h) return { w: 0, h: 0 };
    return vp.w / vp.h > ratio ? { w: vp.w, h: vp.w / ratio } : { w: vp.h * ratio, h: vp.h };
  }, [vp, ratio]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const s = useMotionValue(1);
  const inv = useTransform(s, (v) => 1 / v);

  const [openPlace, setOpenPlace] = useState<WorldPlace | null>(null);
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

  const zoomTo = (px: number, py: number, scale: number) => {
    const c = centreOn(px, py, scale, stage, vp);
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
    // Before mount the orientation is unknown; render the meadow colour only (no layout jump).
    return <div className={styles.viewport} aria-busy="true" />;
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
    play("pick");
    const h = map.places[p.id].hotspot;
    zoomTo(h.x * stage.w, h.y * stage.h, PLACE_ZOOM);
    setOpenPlace(p);
  };

  const closePlace = () => {
    play("whoosh");
    if (openPlace) {
      const h = map.places[openPlace.id].hotspot;
      zoomTo(h.x * stage.w, h.y * stage.h, 1);
    }
    setOpenPlace(null);
  };

  const currentPad = map.places[current].pad;

  return (
    <>
      <div
        ref={viewportRef}
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
        >
          <AssetImage id={assetId} alt="" sizes={`${Math.round(stage.w)}px`} className={styles.mapImg} priority />

          {/* glowing ring on the current place's stepping stone */}
          <span
            className={styles.ring}
            style={{ left: `${currentPad.x * 100}%`, top: `${currentPad.y * 100}%`, width: `${currentPad.r * 2.6 * 100}%` }}
          >
            <AssetImage id="ring_current" alt="" sizes="20vw" />
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

      {openPlace ? (
        <div className={styles.placeView} data-testid="place-view" data-place={openPlace.id}>
          <NameSign text={placeName(openPlace)} className={styles.placeSign} />
          <span />
          <div className={styles.stones}>
            {[...openPlace.levels]
              .sort((a, b) => a.order - b.order)
              .map((lvl) => {
                const ls = state.places[openPlace.id].levels[lvl.id];
                return (
                  <ThingButton
                    key={lvl.id}
                    className={styles.stone}
                    art={LEVEL_NODE[ls]}
                    sizes="120px"
                    sound={ls === "locked" ? "pop" : "pick"}
                    label={ls === "locked" ? t("levelLocked", { n: lvl.order }) : t("level", { n: lvl.order, title: lvl.title[locale] })}
                    testId={`level-${lvl.id}`}
                    onPress={() => sayLine(ls === "locked" ? t("levelLocked", { n: lvl.order }) : t("levelsComing"))}
                  >
                    <span className={styles.stoneNum} aria-hidden>
                      {new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(lvl.order)}
                    </span>
                    {ls === "locked" ? <AssetImage id="badge_lock" alt="" sizes="48px" className={styles.stoneBadge} /> : null}
                    {ls === "completed" ? <AssetImage id="badge_star" alt="" sizes="48px" className={styles.stoneBadge} /> : null}
                  </ThingButton>
                );
              })}
          </div>
          <button type="button" className={styles.close} aria-label={t("close")} onClick={closePlace} data-testid="place-close">
            <X size={36} strokeWidth={3} aria-hidden />
          </button>
        </div>
      ) : null}

      {say ? (
        <div className={styles.sayWrap} key={say.key}>
          <SayBubble text={say.text} locale={locale} replayLabel={t("close")} />
        </div>
      ) : null}
    </>
  );
}
