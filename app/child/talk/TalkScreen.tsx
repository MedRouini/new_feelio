"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { useCalm } from "@/child/ui/useCalm";
import { Mic, RotateCcw, Square, X } from "lucide-react";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { SayBubble } from "@/child/ui/SayBubble";
import { play } from "@/child/ui/sound";
import uiStyles from "@/child/ui/ui.module.css";
import { AssetImage } from "@/design/components/AssetImage";
import { isDelivered } from "@/design/assets";
import { FEELING_FACE, LOADING_BEAT, TALK_MASCOT, pick, pickOptional, placeArrival } from "@/design/asset-slots";
import { VoiceProvider, useFeelioVoice } from "@/safety/voice-agent/useVoice";
import type { ToolCall } from "@/safety/voice-agent/tools";
import styles from "./talk.module.css";

// Talk (D-068, redesign D-069): a friendly voice room in Feelio's world, not a call screen. Feelio is the
// hero; soft brand-colour rings breathe with whoever is speaking (the child's level while listening,
// Feelio's while speaking); one big button; time left is an arc around it, no numbers to read. Every
// edge (microphone refused, connection lost, silence, time up) has a kind, clear way on.

type Place = { id: string; name: string; open: boolean };
type Help = { kind: string; text: string };
type Card =
  | { type: "feeling"; feeling: "happy" | "sad" | "angry" | "excited" }
  | { type: "breathing"; rounds: number }
  | { type: "place"; place: Place }
  | { type: "help"; kinds: string[] };
type Mood = "happy" | "excited" | "empathy" | "calm";

/** One breath: in, then out (ms each). Slow enough for a young child. */
const BREATH_MS = 4000;
/** A mood from the companion shows this long, then Feelio follows the talk again. */
const MOOD_MS = 8000;
const MOUTH = ["mascot_speaking_closed", "mascot_speaking_half", "mascot_speaking_open"] as const;

export function TalkScreen(props: { places: Place[]; help: Help[] }) {
  return (
    <VoiceProvider>
      <Talk {...props} />
    </VoiceProvider>
  );
}

function Talk({ places, help }: { places: Place[]; help: Help[] }) {
  const t = useTranslations("child.talk");
  const tOnb = useTranslations("child.onb");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const reduce = useCalm();
  const [card, setCard] = useState<Card | null>(null);
  const [mood, setMood] = useState<{ mood: Mood; until: number } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [mouth, setMouth] = useState(0);

  const onTool = useCallback(
    (call: ToolCall) => {
      switch (call.name) {
        case "set_mascot_state":
          setMood({ mood: call.args.mood, until: Date.now() + MOOD_MS });
          break;
        case "show_safety_resources":
          // Help always wins and stays until the child closes it.
          setCard({ type: "help", kinds: call.args.kinds });
          break;
        case "show_feeling_card":
          setCard((c) => (c?.type === "help" ? c : { type: "feeling", feeling: call.args.feeling }));
          break;
        case "start_breathing":
          setCard((c) => (c?.type === "help" ? c : { type: "breathing", rounds: call.args.rounds }));
          break;
        case "suggest_place": {
          const place = places.find((p) => p.id === call.args.place && p.open);
          if (place) setCard((c) => (c?.type === "help" ? c : { type: "place", place }));
          break;
        }
      }
    },
    [places],
  );
  const voice = useFeelioVoice({ onTool });
  const { state, outputVolume, inputVolume } = voice;
  const live = state === "connecting" || state === "listening" || state === "thinking" || state === "speaking";

  useEffect(() => {
    if (!voice.deadline && !mood) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [voice.deadline, mood]);

  // The rings breathe with the voice that is speaking: a CSS variable, set every frame, no re-render.
  // While Feelio speaks, its mouth frames follow its voice (only when those poses are delivered).
  const hero = useRef<HTMLDivElement>(null);
  const hasMouth = MOUTH.every(isDelivered);
  useEffect(() => {
    const el = hero.current;
    if (!el) return;
    const listen = state === "listening";
    const speak = state === "speaking";
    if (reduce || (!listen && !speak)) {
      el.style.setProperty("--v", "0");
      return;
    }
    let raf = 0;
    let smooth = 0;
    let lastBucket = -1;
    const tick = () => {
      const v = Math.min(1, ((listen ? inputVolume() : outputVolume()) || 0) * (listen ? 2.2 : 1.6));
      smooth += (v - smooth) * 0.35;
      el.style.setProperty("--v", smooth.toFixed(3));
      if (speak && hasMouth) {
        const bucket = smooth < 0.08 ? 0 : smooth < 0.3 ? 1 : 2;
        if (bucket !== lastBucket) {
          lastBucket = bucket;
          setMouth(bucket);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--v", "0");
    };
  }, [state, reduce, inputVolume, outputVolume, hasMouth]);

  const moodNow = mood && mood.until > now ? mood.mood : null;
  const pose: MascotPose = (() => {
    if (problem === "mic") return pick(TALK_MASCOT.listening);
    if (state === "lost") return "mascot_confused";
    if (state === "ended") return "mascot_waving";
    if (moodNow && state !== "connecting") return pick(TALK_MASCOT[moodNow]);
    if (state === "speaking") return hasMouth ? MOUTH[mouth] : pick(TALK_MASCOT.speaking);
    if (state === "thinking" || state === "connecting") return pick(TALK_MASCOT.connecting);
    if (state === "listening") return pick(TALK_MASCOT.listening);
    return pick(TALK_MASCOT.idle);
  })();

  const line = (() => {
    if (problem) return problem === "mic" ? t("micNeeded") : t.has(`refused.${problem}`) ? t(`refused.${problem}`) : t("refused.unavailable");
    switch (state) {
      case "idle":
        return t("intro");
      case "connecting":
        return t("connecting");
      case "listening":
        return voice.quiet ? t("quiet") : t("listening");
      case "thinking":
        return t("thinking");
      case "speaking":
        return voice.caption ?? t("speaking");
      case "ended":
        return t("ended");
      case "lost":
        return t("lost");
    }
  })();

  const left = voice.deadline ? Math.max(0, (voice.deadline - now) / 1000) : null;
  const share = left !== null && voice.allowed ? left / voice.allowed : 1;

  async function toggle() {
    play("tap");
    if (live) return voice.stop();
    setProblem(null);
    setCard(null);
    const r = await voice.start();
    if (!r.ok) setProblem(r.reason);
  }

  const retry = state === "lost" || problem !== null;
  const buttonLabel = live ? t("stop") : retry ? t("tryAgain") : state === "ended" ? t("talkAgain") : t("start");
  const ButtonIcon = live ? Square : retry ? RotateCcw : Mic;

  return (
    <div className={styles.room} data-state={problem ? "problem" : state} data-mood={moodNow ?? undefined}>
      {/* Feelio's world, softly out of focus behind the talk (approved art, a CSS filter) */}
      {(["land", "port"] as const).map((o) => (
        <div key={o} className={uiStyles.sceneBg} data-orient={o} aria-hidden>
          <AssetImage id={o === "land" ? "scene_meadow_land" : "scene_meadow_port"} alt="" sizes="100vw" className={[uiStyles.sceneImg, styles.softWorld].join(" ")} priority />
        </div>
      ))}
      <div className={styles.veil} aria-hidden />

      <p className={styles.aiChip} data-testid="ai-chip">
        {t("aiChip")}
      </p>

      <div className={styles.say} aria-live="polite">
        <SayBubble text={line} locale={locale} replayLabel={tOnb("replay")} />
      </div>

      <div ref={hero} className={styles.hero}>
        <span className={styles.aura} aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <div className={styles.body} data-bounce={state === "speaking" && !hasMouth ? true : undefined}>
          <Mascot pose={pose} label={tOnb("aiSign")} sizes="44vmin" className={styles.mascot} />
        </div>
        {state === "connecting" || state === "thinking" ? (
          <span className={styles.beat} aria-hidden>
            {LOADING_BEAT.map((id) => (
              <AssetImage key={id} id={id} alt="" sizes="56px" className={styles.beatItem} />
            ))}
          </span>
        ) : null}
      </div>

      <div className={styles.controls}>
        <span className={styles.micWrap}>
          {left !== null ? <TimeArc share={share} late={left < 30} /> : null}
          <button type="button" className={styles.mic} data-live={live || undefined} onClick={toggle} disabled={state === "connecting"} aria-label={buttonLabel} data-testid="talk-toggle">
            <ButtonIcon size={44} strokeWidth={2.6} aria-hidden fill={live ? "currentColor" : "none"} />
          </button>
        </span>
        <span className={styles.micLabel} aria-hidden>
          {buttonLabel}
        </span>
        {left !== null ? <span className={styles.srOnly}>{t("timeLeft", { minutes: Math.floor(left / 60) })}</span> : null}
      </div>

      <AnimatePresence>
        {card ? (
          <motion.div
            key={card.type === "place" ? `place-${card.place.id}` : card.type}
            className={styles.cardLayer}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.9 }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 240, damping: 26 }}
          >
            <TalkCard card={card} help={help} onClose={() => setCard(null)} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Time left as an arc that empties around the button (amber in the last 30 seconds). No numbers. */
function TimeArc({ share, late }: { share: number; late: boolean }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg className={styles.arc} viewBox="0 0 100 100" aria-hidden data-late={late || undefined}>
      <circle cx="50" cy="50" r={r} className={styles.arcTrack} />
      <circle cx="50" cy="50" r={r} className={styles.arcLeft} strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, share)))} />
    </svg>
  );
}

function TalkCard({ card, help, onClose }: { card: Card; help: Help[]; onClose: () => void }) {
  const t = useTranslations("child.talk");
  return (
    <div className={styles.card} data-card={card.type} role={card.type === "help" ? "alertdialog" : "dialog"} aria-label={card.type === "help" ? t("helpTitle") : undefined}>
      <button type="button" className={styles.close} onClick={onClose} aria-label={t("close")}>
        <X size={28} aria-hidden />
      </button>
      {card.type === "feeling" ? (
        <figure className={styles.feeling}>
          <AssetImage id={pick(FEELING_FACE[card.feeling])} alt="" sizes="30vmin" className={styles.face} />
          <figcaption>{t(`feelings.${card.feeling}`)}</figcaption>
        </figure>
      ) : null}
      {card.type === "breathing" ? <Breathing rounds={card.rounds} onDone={onClose} /> : null}
      {card.type === "place" ? <PlaceCard place={card.place} /> : null}
      {card.type === "help" ? (
        <div className={styles.help}>
          <h2>{t("helpTitle")}</h2>
          <ul>
            {help
              .filter((h) => card.kinds.includes(h.kind))
              .map((h) => (
                <li key={h.kind}>{h.text}</li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Breathing({ rounds, onDone }: { rounds: number; onDone: () => void }) {
  const t = useTranslations("child.talk");
  const [step, setStep] = useState(0); // even: breathe in, odd: breathe out, 2 × rounds: done
  useEffect(() => {
    if (step > rounds * 2) return;
    const id = setTimeout(() => (step === rounds * 2 ? onDone() : setStep(step + 1)), step === rounds * 2 ? 2500 : BREATH_MS);
    return () => clearTimeout(id);
  }, [step, rounds, onDone]);
  const done = step >= rounds * 2;
  return (
    <div className={styles.breathing} data-phase={done ? "done" : step % 2 === 0 ? "in" : "out"}>
      <span className={styles.breathBall} aria-hidden>
        <AssetImage id="companion_cloud" alt="" sizes="24vmin" />
      </span>
      <p aria-live="polite">{done ? t("breatheDone") : step % 2 === 0 ? t("breatheIn") : t("breatheOut")}</p>
    </div>
  );
}

function PlaceCard({ place }: { place: Place }) {
  const t = useTranslations("child.talk");
  const art = pickOptional(placeArrival(place.id));
  return (
    <a className={styles.place} href={`/place/${place.id}`}>
      {art ? <AssetImage id={art} alt="" sizes="24vmin" className={styles.placeArt} /> : null}
      <span>{t("visit", { place: place.name })}</span>
    </a>
  );
}
