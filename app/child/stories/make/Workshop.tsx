"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "@/app/child/hello/Sparkles";
import { ActionObject } from "@/child/ui/ActionObject";
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
import { StageCarousel } from "./StageCarousel";
import { STEP_ICON, StepTickets } from "./StepTickets";
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
  /** Keyboard users keep their place: after a pick from the carousel, focus moves to the next step's carousel. */
  const pickerArea = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    const id = setTimeout(() => trackRef.current?.focus({ preventScroll: true }), 350);
    return () => clearTimeout(id);
  }, [active]);
  /** Phones show the step tickets as pictures only. */
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(orientation: portrait)");
    const on = () => setCompact(mq.matches);
    mq.addEventListener("change", on);
    queueMicrotask(on);
    return () => mq.removeEventListener("change", on);
  }, []);

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
  const art = (slot: Slot, c?: Item) => (c ? pickOptional(choiceArt(slot, c.id)) : null);

  const hallLand = pickOptional(["scene_story_stage_land"] as const);
  const hallPort = pickOptional(["scene_story_stage_port"] as const);
  const { place, hero, feeling, adventure } = filled;
  const lineAudio = line === t("hello") ? "stories_hello" : line === t("ready") ? "stories_ready" : undefined;

  /** One part of the stage, showing its picture (or its step icon, softly, while empty). Tap to change it. */
  const part = (slot: Slot, children: React.ReactNode) => (
    <button
      type="button"
      className={styles.part}
      data-part={slot}
      data-active={active === slot || undefined}
      data-filled={filled[slot] ? true : undefined}
      onClick={() => openSlot(slot)}
      aria-label={filled[slot] ? t("steps.done", { slot: t(`slots.${slot}`), choice: label(filled[slot]!) }) : t(`slots.${slot}`)}
      data-testid={`stage-${slot}`}
    >
      {children}
    </button>
  );
  const pic = (slot: Slot, c: Item | undefined, sizes: string, cls: string) => {
    if (!c) return <AssetImage id={STEP_ICON[slot]} alt="" sizes={sizes} className={[cls, styles.ghost].join(" ")} />;
    const a = art(slot, c);
    return (
      <motion.span key={c.id} className={styles.picWrap} initial={calm ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
        {a ? <AssetImage id={a} alt="" sizes={sizes} className={cls} /> : <span className={styles.picWord}>{label(c)}</span>}
      </motion.span>
    );
  };

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

      <Caption text={line} audioKey={lineAudio} locale={locale} replayLabel={tOnb("replay")} variant="title" className={styles.question} testId="workshop-line" />

      <div className={styles.ticketRow}>
        <StepTickets filled={filled} active={making ? null : active} locale={locale} compact={compact} onOpen={openSlot} />
      </div>

      {/* The stage shows the story being built, in pictures: the place is the set behind, the hero stands
          in the spotlight, the feeling colours the lights (its face on the lamp), the adventure is a prop. */}
      <div className={styles.theatre}>
        <div className={styles.stage} data-place={place?.id} data-feeling={feeling?.id}>
          <span className={styles.lights} aria-hidden />
          {part("place", <span className={styles.set}>{pic("place", place, "40vw", styles.setArt)}</span>)}
          {part("feeling", <span className={styles.lamp}>{pic("feeling", feeling, "80px", styles.lampArt)}</span>)}
          {part(
            "hero",
            <span className={styles.actor}>
              {pic("hero", hero, "26vmin", styles.actorArt)}
              {hero ? <Sparkles burst={burst} /> : null}
            </span>,
          )}
          {part("adventure", <span className={styles.prop}>{pic("adventure", adventure, "16vmin", styles.propArt)}</span>)}
          {/* the curtains: they close while the story is being written */}
          <span className={styles.curtain} data-side="start" aria-hidden />
          <span className={styles.curtain} data-side="end" aria-hidden />
        </div>
        <Mascot pose={pose} label={tOnb("aiSign")} sizes="18vmin" className={styles.director} />
      </div>

      <div className={styles.picker} ref={pickerArea}>
        <AnimatePresence mode="wait" initial={false}>
          {making ? (
            <motion.div key="making" className={styles.making} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={styles.beat} aria-hidden>
                {LOADING_BEAT.map((id) => (
                  <AssetImage key={id} id={id} alt="" sizes="56px" className={styles.beatItem} />
                ))}
              </span>
            </motion.div>
          ) : active ? (
            <motion.div key={active} className={styles.pickerInner} initial={calm ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
              <StageCarousel
                items={lists[active].map((c) => ({ id: c.id, word: label(c), art: pickOptional(choiceArt(active, c.id)) }))}
                index={index[active]}
                onIndex={(i) => setIndex((x) => ({ ...x, [active]: i }))}
                onPick={(it) => {
                  const c = lists[active].find((x) => x.id === it.id);
                  if (!c) return;
                  focusNext.current = !!pickerArea.current?.contains(document.activeElement);
                  void choose(active, c);
                }}
                label={t(`ask.${active}`)}
                prevLabel={tOnb("prevOne")}
                nextLabel={tOnb("nextOne")}
                chooseLabel={t("choose")}
                rtl={rtl}
                selectedId={filled[active]?.id}
                trackRef={trackRef}
                testId="choice-picker"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className={styles.actions}>
        {voice && !making ? (
          <ActionObject art="ui_mic_object" label={live ? t("stopTalking") : t("tellFeelio")} ready={live} loading={v.state === "connecting"} onPress={() => (live ? v.stop() : void v.start())} sizes="12vmin" className={styles.mic} testId="story-voice" />
        ) : null}
        {complete ? (
          <ActionObject art="ui_btn_curtain_rope" label={t("rope")} ready={!making} loading={making} loadingLabel={t("writing")} onPress={() => void make()} sizes="18vmin" className={styles.rope} testId="make-it" />
        ) : null}
      </div>
      {problem ? <span className={styles.srOnly} role="status">{problem}</span> : null}
    </div>
  );
}
