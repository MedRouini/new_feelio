"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/child/ui/Avatar";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { NameSign } from "@/child/ui/NameSign";
import { SayBubble } from "@/child/ui/SayBubble";
import { play } from "@/child/ui/sound";
import { LoadingScene } from "@/child/ui/loading/LoadingScene";
import { useLoad } from "@/child/ui/loading/useLoad";
import { centreOf, useTransitionTo } from "@/child/ui/loading/useTransitionTo";
import type { Avatar as AvatarChoice } from "@/child/options";
import { LEVEL_NODE, levelIcon, pick, pickOptional, placeMapArt } from "@/design/asset-slots";
import { isDelivered } from "@/design/assets";
import { AssetImage } from "@/design/components/AssetImage";
import { containSize, facingAt, pointAt, subPath, toPixels, type Pt } from "@/world/geometry";
import { useElementSize, useOrientation } from "@/world/map/useOrientation";
import { ringStyle } from "@/world/ring";
import type { WorldPlace } from "@/world/schema";
import type { PlaceProgress } from "@/world/unlock";
import mapStyles from "@/world/map/map.module.css";
import styles from "./place.module.css";

const WALK_PX_PER_S = 120;

type Props = {
  place: WorldPlace;
  progress: PlaceProgress;
  locale: "en" | "ar";
  avatar: AvatarChoice;
  /** The level just completed: the characters walk from its stone to the next one. */
  fromLevelId: string | null;
  /** The parent allows scenarios (enforced again on the server). */
  scenariosOn: boolean;
};

function deferred() {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * A place's own map (D-056, docs/LEVEL_FLOW.md): the place's art with one stone per level. Stones show
 * each level's state (locked, available, in progress, completed); the glowing ring and the characters
 * mark the level to play next. Tapping a level opens it through the shared loading transition.
 * Until the place's art is delivered, the art is a grey TODO(PLACEHOLDER) box and the stones sit on a
 * provisional layout from world.json (`map.<orientation>.provisional`).
 */
export function PlaceMapView({ place, progress, locale, avatar, fromLevelId, scenariosOn }: Props) {
  const t = useTranslations("child.place");
  const tMap = useTranslations("child.map");
  const orientation = useOrientation();
  const [setAreaEl, area] = useElementSize<HTMLDivElement>();
  const reduce = useReducedMotion();
  const [go, transition] = useTransitionTo();
  const [say, setSay] = useState<{ text: string; key: number } | null>(null);
  const sayKey = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const pm = orientation ? place.map[orientation] : null;
  const stage = useMemo(() => (pm ? containSize(pm.size[0] / pm.size[1], area) : { w: 0, h: 0 }), [pm, area]);
  const levels = useMemo(() => [...place.levels].sort((a, b) => a.order - b.order), [place]);

  // Loading gate: the map art (when delivered) must be downloaded and decoded before the scene leaves.
  const art = pm ? pick(placeMapArt(pm.asset)) : null;
  const [waits] = useState(() => new Map<string, ReturnType<typeof deferred>>());
  const waitFor = (id: string) => {
    if (!waits.has(id)) waits.set(id, deferred());
    return waits.get(id)!;
  };
  const load = useLoad(() => (art && isDelivered(art) ? waitFor(art).promise : Promise.resolve()), `${place.id}:${art ?? "none"}`);
  const [gone, setGone] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  useEffect(() => {
    // An image that finished before hydration never fires onLoad: check it once mounted.
    const img = stageRef.current?.querySelector("img");
    if (art && img?.complete && img.naturalWidth) waitFor(art).resolve();
  });

  // Where the characters stand: the level to play next, or the last finished one.
  const lastDone = [...levels].reverse().find((l) => progress.levels[l.id] === "completed");
  const hereId = progress.currentLevelId ?? lastDone?.id ?? levels[0].id;
  const markerX = useMotionValue(0);
  const markerY = useMotionValue(0);
  const markerLeft = useTransform(markerX, (v) => `${v * 100}%`);
  const markerTop = useTransform(markerY, (v) => `${v * 100}%`);
  const [pose, setPose] = useState<MascotPose>("mascot_marker");
  const [walking, setWalking] = useState(false);
  const ready = load.phase === "ready";

  useEffect(() => {
    if (!pm || !stage.w) return;
    const to = pm.stones[hereId];
    markerX.set(to.x);
    markerY.set(to.y);
    const from = fromLevelId ? pm.stones[fromLevelId] : null;
    if (!ready || !from || fromLevelId === hereId || reduce) return;
    const px = toPixels(subPath(pm.path as Pt[], from.pathIndex, to.pathIndex), stage.w, stage.h);
    const length = px.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - px[i][0], p[1] - px[i][1]), 0);
    markerX.set(from.x);
    markerY.set(from.y);
    let controls: { stop: () => void } | null = null;
    let facing: "left" | "right" | null = null;
    const raf = requestAnimationFrame(() => {
      setWalking(true);
      controls = animate(0, 1, {
        duration: Math.min(Math.max(length / WALK_PX_PER_S, 1), 4),
        ease: "linear",
        onUpdate: (v) => {
          const [qx, qy] = pointAt(px, v);
          markerX.set(qx / stage.w);
          markerY.set(qy / stage.h);
          const f = facingAt(px, v);
          if (f !== facing) {
            facing = f;
            setPose(f === "left" ? "mascot_walking_left" : "mascot_walking_right");
          }
        },
        onComplete: () => {
          setWalking(false);
          play("unlock");
          setPose(isDelivered("mascot_excited") ? "mascot_excited" : "mascot_feel_excited");
          setTimeout(() => setPose("mascot_marker"), 1200);
        },
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      controls?.stop();
    };
  }, [pm, stage, hereId, fromLevelId, ready, reduce, markerX, markerY]);

  useEffect(() => {
    if (!say) return;
    const id = setTimeout(() => setSay(null), 6000);
    return () => clearTimeout(id);
  }, [say]);

  if (!pm || !art) return <div ref={setAreaEl} className={styles.area} aria-busy="true" />;

  const sayLine = (text: string) => setSay({ text, key: ++sayKey.current });
  const placeName = place.name[locale];
  const n = (v: number) => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(v);

  const onLevel = (levelId: string, el: Element) => {
    const lvl = levels.find((l) => l.id === levelId)!;
    const st = progress.levels[levelId];
    if (st === "locked") {
      play("pop");
      const prev = levels[levels.indexOf(lvl) - 1];
      sayLine(t("notYet", { n: n(prev ? prev.order : 1) }));
      return;
    }
    if (!scenariosOn) {
      play("pop");
      sayLine(t("off"));
      return;
    }
    play("pick");
    go(`/place/${place.id}/level/${levelId}`, { context: "level", from: centreOf(el), tint: pm.backdrop });
  };

  const levelLabel = (levelId: string) => {
    const lvl = levels.find((l) => l.id === levelId)!;
    const st = progress.levels[levelId];
    const args = { n: n(lvl.order), title: lvl.title[locale] };
    return st === "locked" ? t("levelLocked", args) : st === "completed" ? t("levelDone", args) : st === "in_progress" ? t("levelStarted", args) : t("level", args);
  };
  const BackIcon = locale === "ar" ? ChevronRight : ChevronLeft;

  return (
    <>
      <div ref={setAreaEl} className={styles.area} style={{ background: pm.backdrop }} role="region" aria-label={t("mapLabel", { place: placeName })}>
        <div
          ref={stageRef}
          className={styles.stage}
          style={{ width: stage.w, height: stage.h, left: (area.w - stage.w) / 2, top: (area.h - stage.h) / 2 }}
          data-orientation={orientation}
          data-place={place.id}
          data-provisional={pm.provisional || undefined}
        >
          <AssetImage
            key={imgKey}
            id={art}
            alt=""
            sizes={`${Math.round(stage.w)}px`}
            className={styles.art}
            priority
            onLoad={() => waitFor(art).resolve()}
            onError={() => waitFor(art).reject()}
          />

          {progress.currentLevelId ? (
            <span className={mapStyles.ring} style={ringStyle(pm.stones[progress.currentLevelId])} data-testid="place-ring">
              <AssetImage id="ring_current" alt="" sizes="20vw" className={mapStyles.ringImg} />
            </span>
          ) : null}

          {levels.map((lvl) => {
            const stone = pm.stones[lvl.id];
            const st = progress.levels[lvl.id];
            const icon = pickOptional(levelIcon(lvl.icon));
            return (
              <button
                key={lvl.id}
                type="button"
                className={styles.stone}
                style={{ left: `${stone.x * 100}%`, top: `${stone.y * 100}%`, width: `${stone.rx * 200}%` }}
                data-level={lvl.id}
                data-state={st}
                aria-label={levelLabel(lvl.id)}
                onClick={(e) => onLevel(lvl.id, e.currentTarget)}
                data-testid={`level-${lvl.id}`}
              >
                {icon ? <AssetImage id={icon} alt="" sizes="20vmin" className={styles.icon} /> : null}
                <AssetImage id={pick(LEVEL_NODE[st])} alt="" sizes="160px" className={styles.node} />
                <span className={styles.num} aria-hidden>
                  {n(lvl.order)}
                </span>
                {st === "locked" ? <AssetImage id="badge_lock" alt="" sizes="48px" className={styles.badge} /> : null}
                {st === "completed" ? <AssetImage id="badge_star" alt="" sizes="48px" className={styles.badge} /> : null}
              </button>
            );
          })}

          {/* The characters stand beside the stone (not on it), on the side facing the middle of the map,
              so its number stays visible and tappable and they never fall off the edge */}
          <motion.div
            className={[mapStyles.marker, styles.marker].join(" ")}
            style={{ left: markerLeft, top: markerTop, ["--beside" as string]: `${(pm.stones[hereId].x < 0.5 ? -1 : 1) * Math.round(stage.w * pm.stones[hereId].rx * 1.35)}px` }}
            data-testid="place-marker"
          >
            <div className={mapStyles.markerInner} style={{ ["--marker" as string]: `${Math.round(Math.max(64, stage.w * pm.stones[hereId].rx * 1.1))}px` }}>
              <Mascot pose={pose} label={tMap("you")} className={mapStyles.markerMascot} sizes="20vmin" />
              <Avatar avatar={avatar} sizes="12vmin" className={[mapStyles.markerAvatar, walking ? mapStyles.hopping : ""].join(" ")} />
            </div>
          </motion.div>
        </div>
      </div>

      <div className={styles.top}>
        <button
          type="button"
          className={styles.back}
          aria-label={t("back")}
          data-testid="place-back"
          onClick={(e) => {
            play("tap");
            go("/", { context: "generic", from: centreOf(e.currentTarget) });
          }}
        >
          <BackIcon size={40} strokeWidth={3} aria-hidden />
        </button>
        <NameSign text={placeName} className={styles.sign} testId="place-sign" />
      </div>

      {say ? (
        <div className={mapStyles.sayWrap} key={say.key}>
          <SayBubble text={say.text} locale={locale} replayLabel={tMap("close")} />
        </div>
      ) : null}

      {gone ? null : (
        <LoadingScene
          context="place"
          placeId={place.id}
          tint={pm.backdrop}
          phase={load.phase === "ready" ? "loading" : load.phase}
          leaving={ready}
          onRetry={() => {
            waits.delete(art);
            setImgKey((k) => k + 1);
            load.retry();
          }}
          onLeft={() => setGone(true)}
        />
      )}
      {transition}
    </>
  );
}
