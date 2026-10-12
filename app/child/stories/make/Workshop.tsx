"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, Mic, Square, WandSparkles } from "lucide-react";
import { Carousel } from "@/app/child/hello/Carousel";
import { Sparkles } from "@/app/child/hello/Sparkles";
import { Mascot } from "@/child/ui/Mascot";
import { Caption } from "@/child/ui/Caption";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import uiStyles from "@/child/ui/ui.module.css";
import { AssetImage } from "@/design/components/AssetImage";
import { LOADING_BEAT, pick, pickOptional } from "@/design/asset-slots";
import { VoiceProvider, useFeelioVoice } from "@/safety/voice-agent/useVoice";
import type { ToolCall } from "@/safety/voice-agent/tools";
import { SLOTS, type Slot } from "@/safety/stories/choices";
import { STORY_ART, choiceArt } from "../art";
import styles from "./workshop.module.css";

type Item = { id: string; en: string; ar: string };

/**
 * The story workshop (D-070): Feelio asks four little questions, one slot at a time. The child taps a
 * picture (or says it, when Talk is on: Feelio fills the slot through a server tool). A choice flies
 * into its slot with a sparkle; any slot can be changed. When all four are filled, the magic button
 * makes the book. Nothing is typed, and only list ids go from this screen to the server.
 */
export function Workshop(props: { lists: Record<Slot, Item[]>; initial: Partial<Record<Slot, Item>>; voice: boolean }) {
  return (
    <VoiceProvider>
      <WorkshopRoom {...props} />
    </VoiceProvider>
  );
}

function WorkshopRoom({ lists, initial, voice }: { lists: Record<Slot, Item[]>; initial: Partial<Record<Slot, Item>>; voice: boolean }) {
  const t = useTranslations("child.stories");
  const tOnb = useTranslations("child.onb");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const rtl = locale === "ar";
  const router = useRouter();
  const calm = useCalm();
  const [filled, setFilled] = useState<Partial<Record<Slot, Item>>>(initial);
  const [active, setActive] = useState<Slot | null>(() => SLOTS.find((s) => !initial[s]) ?? null);
  /** The slot being chosen right now: a tap on a picker that is still animating away is ignored. */
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  const [index, setIndex] = useState<Record<Slot, number>>({ hero: 0, place: 0, feeling: 0, adventure: 0 });
  const [line, setLine] = useState(() => t("hello"));
  const [burst, setBurst] = useState(0);
  const [making, setMaking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const complete = SLOTS.every((s) => filled[s]);

  const label = (c: Item) => (locale === "ar" ? c.ar : c.en);
  /** Tells Feelio about a tap while a voice talk is on (so voice and taps stay in step). */
  const voiceRef = useRef<((s: string) => void) | null>(null);

  const fill = useCallback(
    (slot: Slot, item: Item, fromVoice: boolean) => {
      setFilled((f) => {
        const next = { ...f, [slot]: item };
        const nextEmpty = SLOTS.find((s) => !next[s]) ?? null;
        setActive(nextEmpty);
        setLine(nextEmpty ? `${t("nice", { choice: label(item) })} ${t(`ask.${nextEmpty}`)}` : t("ready"));
        return next;
      });
      setBurst((b) => b + 1);
      play("pick");
      if (!fromVoice) voiceRef.current?.(`The child chose ${item.en} for the ${slot}.`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  const onTool = useCallback(
    (call: ToolCall) => {
      if (call.name === "show_story_choice") fill(call.args.slot, { id: call.args.id, en: call.args.en, ar: call.args.ar }, true);
    },
    [fill],
  );
  const v = useFeelioVoice({ onTool, purpose: "story" });
  const live = v.state === "connecting" || v.state === "listening" || v.state === "thinking" || v.state === "speaking";
  useEffect(() => {
    voiceRef.current = live ? v.context : null;
  }, [live, v.context]);

  const openSlot = (s: Slot) => {
    if (making) return;
    setActive(s);
    setLine(filled[s] ? t("change", { slot: t(`slots.${s}`) }) : t(`ask.${s}`));
  };

  async function choose(slot: Slot, item: Item) {
    if (slot !== activeRef.current) return;
    setProblem(null);
    const res = await fetch("/api/child/stories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "slot", slot, id: item.id }) });
    if (!res.ok) {
      const e = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "unavailable";
      setProblem(e);
      setLine(t.has(`refused.${e}`) ? t(`refused.${e}`) : t("refused.unavailable"));
      return;
    }
    fill(slot, item, false);
  }

  async function make() {
    if (making) return;
    if (live) v.stop();
    play("unlock");
    setMaking(true);
    setLine(t("writing"));
    const res = await fetch("/api/child/stories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create" }) });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !data.id) {
      setMaking(false);
      const e = data.error ?? "unavailable";
      setLine(t.has(`refused.${e}`) ? t(`refused.${e}`) : t("refused.unavailable"));
      return;
    }
    router.push(`/stories/${data.id}?new=1`);
  }

  const pose = making ? "mascot_making" : live && v.state === "listening" ? pick(["mascot_listening", "mascot_idle"] as const) : pick(STORY_ART.director);
  const items = active ? lists[active] : [];
  const centre = active ? items[index[active]] : null;
  const art = (slot: Slot, c?: Item) => (c ? pickOptional(choiceArt(slot, c.id)) : null);

  /** One part of the stage: tap it to choose (or change) that part. */
  const part = (slot: Slot, children: React.ReactNode) => (
    <button
      type="button"
      className={styles.part}
      data-part={slot}
      data-active={active === slot || undefined}
      data-filled={filled[slot] ? true : undefined}
      onClick={() => openSlot(slot)}
      aria-label={filled[slot] ? `${t(`slots.${slot}`)}: ${label(filled[slot]!)}` : t(`slots.${slot}`)}
      data-testid={`slot-${slot}`}
    >
      {children}
    </button>
  );

  const hallLand = pickOptional(["scene_story_stage_land"] as const);
  const hallPort = pickOptional(["scene_story_stage_port"] as const);
  const place = filled.place;
  const hero = filled.hero;
  const feeling = filled.feeling;
  const adventure = filled.adventure;
  const placeArt = art("place", place);
  const heroArt = art("hero", hero);
  const feelingArt = art("feeling", feeling);

  return (
    <div className={styles.room} data-making={making || undefined}>
      {/* the theatre hall: its scene when delivered, until then flat brand colours (never a blurred picture) */}
      {hallLand && hallPort ? (
        (["land", "port"] as const).map((o) => (
          <div key={o} className={uiStyles.sceneBg} data-orient={o} aria-hidden>
            <AssetImage id={o === "land" ? hallLand : hallPort} alt="" sizes="100vw" className={uiStyles.sceneImg} priority />
          </div>
        ))
      ) : (
        <div className={styles.house} aria-hidden />
      )}
      {/* The one AI notice in stories (owner decision 2026-10-12: Talk and Story only). */}
      <p className={styles.aiLine} data-testid="ai-line">{t("aiChip")}</p>

      <Caption text={line} locale={locale} replayLabel={tOnb("replay")} variant="title" className={styles.question} testId="workshop-line" />

      {/* The stage: the story being built. Place = the backdrop, hero = in the spotlight, feeling = the
          colour of the lights, adventure = the banner. */}
      <div className={styles.theatre}>
        <div className={styles.stage} data-place={place && !placeArt ? place.id : undefined} data-feeling={feeling?.id}>
          {part(
            "place",
            <span className={styles.backdrop}>
              {placeArt ? <AssetImage id={placeArt} alt="" sizes="60vw" className={styles.backdropArt} /> : null}
              <span className={styles.partLabel}>{place ? label(place) : t("slots.place")}</span>
            </span>,
          )}
          <span className={styles.lights} aria-hidden />
          {part(
            "feeling",
            <span className={styles.lamp}>
              {feelingArt ? <AssetImage id={feelingArt} alt="" sizes="80px" /> : null}
              <span className={styles.partLabel}>{feeling ? label(feeling) : t("slots.feeling")}</span>
            </span>,
          )}
          {part(
            "hero",
            <AnimatePresence mode="popLayout">
              <motion.span key={hero?.id ?? "empty"} className={styles.actor} initial={calm ? { opacity: 0 } : { x: rtl ? -80 : 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }}>
                {heroArt ? <AssetImage id={heroArt} alt="" sizes="24vmin" className={styles.actorArt} /> : null}
                <span className={styles.partLabel}>{hero ? label(hero) : t("slots.hero")}</span>
                {hero ? <Sparkles burst={burst} /> : null}
              </motion.span>
            </AnimatePresence>,
          )}
          {part(
            "adventure",
            <span className={styles.banner}>
              <span className={styles.partLabel}>{adventure ? label(adventure) : t("slots.adventure")}</span>
            </span>,
          )}
          {/* the curtains: they close while the story is being written */}
          <span className={styles.curtain} data-side="start" aria-hidden />
          <span className={styles.curtain} data-side="end" aria-hidden />
        </div>
        <Mascot pose={pose} label={tOnb("aiSign")} sizes="20vmin" className={styles.director} />
      </div>

      <div className={styles.props}>
        <AnimatePresence mode="wait">
          {making ? (
            <motion.div key="making" className={styles.making} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={styles.beat} aria-hidden>
                {LOADING_BEAT.map((id) => (
                  <AssetImage key={id} id={id} alt="" sizes="56px" className={styles.beatItem} />
                ))}
              </span>
            </motion.div>
          ) : active ? (
            <motion.div key={active} className={styles.pick} initial={calm ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
              <Carousel
                items={items.map((c) => c.id)}
                index={index[active]}
                onIndex={(i) => setIndex((x) => ({ ...x, [active]: i }))}
                rtl={rtl}
                spacing={0.26}
                reach={2}
                label={t(`ask.${active}`)}
                itemLabel={(id) => label(items.find((c) => c.id === id)!)}
                prevLabel={tOnb("prevOne")}
                nextLabel={tOnb("nextOne")}
                testId="choice-picker"
                render={(id) => {
                  const c = items.find((x) => x.id === id)!;
                  const a = pickOptional(choiceArt(active, id));
                  return (
                    <span className={styles.prop} data-slot={active} data-id={id} data-word={a ? undefined : true}>
                      {a ? <AssetImage id={a} alt="" sizes="20vmin" className={styles.propArt} /> : null}
                      <span className={styles.propWord}>{label(c)}</span>
                    </span>
                  );
                }}
              />
              {centre ? (
                <button type="button" className={styles.choose} onClick={() => void choose(active, centre)} data-testid="choose-this" aria-pressed={filled[active]?.id === centre.id}>
                  <Check size={30} strokeWidth={3} aria-hidden />
                  <span>{t("chooseThis")}</span>
                </button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className={styles.actions}>
        {voice && !making ? (
          <button type="button" className={styles.talk} data-live={live || undefined} onClick={() => (live ? v.stop() : void v.start())} disabled={v.state === "connecting"} data-testid="story-voice">
            {live ? <Square size={26} fill="currentColor" aria-hidden /> : <Mic size={28} aria-hidden />}
            <span>{live ? t("stopTalking") : t("tellFeelio")}</span>
          </button>
        ) : null}
        <AnimatePresence>
          {complete && !making ? (
            <motion.button key="make" type="button" className={styles.makeIt} onClick={() => void make()} initial={calm ? { opacity: 0 } : { scale: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 16 }} data-testid="make-it">
              <WandSparkles size={36} strokeWidth={2.4} aria-hidden />
              <span>{t("makeIt")}</span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
      {problem ? <span className={styles.srOnly} role="status">{problem}</span> : null}
    </div>
  );
}
