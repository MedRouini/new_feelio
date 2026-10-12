"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, Mic, Square, WandSparkles } from "lucide-react";
import { Carousel } from "@/app/child/hello/Carousel";
import { Sparkles } from "@/app/child/hello/Sparkles";
import { Mascot } from "@/child/ui/Mascot";
import { SayBubble } from "@/child/ui/SayBubble";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import { AssetImage } from "@/design/components/AssetImage";
import { LOADING_BEAT, pick, pickOptional } from "@/design/asset-slots";
import { VoiceProvider, useFeelioVoice } from "@/safety/voice-agent/useVoice";
import type { ToolCall } from "@/safety/voice-agent/tools";
import { SLOTS, type Slot } from "@/safety/stories/choices";
import { World } from "../Shelf";
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

  const pose = making ? "mascot_making" : live && v.state === "listening" ? pick(["mascot_listening", "mascot_idle"] as const) : pick(STORY_ART.reader);
  const items = active ? lists[active] : [];
  const centre = active ? items[index[active]] : null;

  return (
    <div className={styles.room} data-making={making || undefined}>
      <World />
      <p className={styles.aiChip}>{t("aiChip")}</p>

      {/* the four slots: the story being built */}
      <ol className={styles.slots} aria-label={t("make")}>
        {SLOTS.map((s) => {
          const c = filled[s];
          const art = c ? pickOptional(choiceArt(s, c.id)) : null;
          return (
            <li key={s}>
              <button type="button" className={styles.slot} data-active={active === s || undefined} data-filled={c ? true : undefined} onClick={() => openSlot(s)} aria-label={c ? `${t(`slots.${s}`)}: ${label(c)}` : t(`slots.${s}`)} data-testid={`slot-${s}`}>
                <span className={styles.medal}>
                  <AnimatePresence mode="popLayout">
                    {c ? (
                      <motion.span key={c.id} className={styles.medalInner} initial={calm ? { opacity: 0 } : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}>
                        {art ? <AssetImage id={art} alt="" sizes="90px" /> : <span className={styles.medalWord}>{label(c)}</span>}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <span className={styles.slotName}>{t(`slots.${s}`)}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={styles.feelio}>
        <Mascot pose={pose} label={tOnb("aiSign")} sizes="24vmin" className={styles.mascot} />
        <SayBubble text={line} locale={locale} replayLabel={tOnb("replay")} className={styles.say} />
      </div>

      <div className={styles.stage}>
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
            <motion.div key={active} className={styles.pick} initial={calm ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
              <Carousel
                items={items.map((c) => c.id)}
                index={index[active]}
                onIndex={(i) => setIndex((x) => ({ ...x, [active]: i }))}
                rtl={rtl}
                spacing={0.3}
                reach={2}
                label={t(`ask.${active}`)}
                itemLabel={(id) => label(items.find((c) => c.id === id)!)}
                prevLabel={tOnb("prevOne")}
                nextLabel={tOnb("nextOne")}
                testId="choice-picker"
                render={(id, isCentre) => {
                  const c = items.find((x) => x.id === id)!;
                  const art = pickOptional(choiceArt(active, id));
                  return (
                    <span className={styles.choice} data-word={art ? undefined : true}>
                      {art ? <AssetImage id={art} alt="" sizes="28vmin" className={styles.choiceArt} /> : <span className={styles.choiceWord}>{label(c)}</span>}
                      {art ? <span className={styles.choiceCaption}>{label(c)}</span> : null}
                      {isCentre ? <Sparkles burst={filled[active]?.id === id ? burst : 0} /> : null}
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
