"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Mic, Square, X } from "lucide-react";
import { Mascot } from "@/child/ui/Mascot";
import { SayBubble } from "@/child/ui/SayBubble";
import { play } from "@/child/ui/sound";
import { AssetImage } from "@/design/components/AssetImage";
import { FEELING_FACE, TALK_MASCOT, pick, pickOptional, placeArrival } from "@/design/asset-slots";
import { VoiceProvider, useFeelioVoice } from "@/safety/voice-agent/useVoice";
import type { ToolCall } from "@/safety/voice-agent/tools";
import styles from "./talk.module.css";

type Place = { id: string; name: string; open: boolean };
type Help = { kind: string; text: string };
type Card =
  | { type: "feeling"; feeling: "happy" | "sad" | "angry" | "excited" }
  | { type: "breathing"; rounds: number }
  | { type: "place"; place: Place }
  | { type: "help"; kinds: string[] };

/** One breath: in, then out (ms each). Slow enough for a young child. */
const BREATH_MS = 4000;
/** A mood from the companion shows this long, then the mascot follows the talk again. */
const MOOD_MS = 8000;

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
  const [card, setCard] = useState<Card | null>(null);
  const [mood, setMood] = useState<{ mood: keyof typeof TALK_MASCOT; until: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
  const live = voice.state === "connecting" || voice.state === "listening" || voice.state === "speaking";

  useEffect(() => {
    if (!voice.deadline && !mood) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [voice.deadline, mood]);

  // The mascot breathes with Feelio's voice: a gentle bounce from the output level (none with reduced motion).
  const body = useRef<HTMLDivElement>(null);
  const { state: voiceState, outputVolume } = voice;
  useEffect(() => {
    const el = body.current;
    if (!el || voiceState !== "speaking" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      el.style.setProperty("--talk-scale", String(1 + Math.min(1, outputVolume() || 0) * 0.06));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--talk-scale", "1");
    };
  }, [voiceState, outputVolume]);

  const moodNow = mood && mood.until > now ? mood.mood : null;
  const stateSlot = voice.state === "ended" ? "idle" : voice.state;
  const pose = pick(TALK_MASCOT[moodNow ?? stateSlot]);

  const line =
    notice ??
    (voice.state === "connecting"
      ? t("connecting")
      : voice.state === "listening"
        ? t("listening")
        : voice.state === "speaking"
          ? t("speaking")
          : voice.state === "ended"
            ? t("ended")
            : t("intro"));

  const secondsLeft = voice.deadline ? Math.max(0, Math.round((voice.deadline - now) / 1000)) : null;

  async function toggle() {
    play("tap");
    if (live) return voice.stop();
    setNotice(null);
    const r = await voice.start();
    if (!r.ok) setNotice(r.reason === "mic" ? t("micNeeded") : t.has(`refused.${r.reason}`) ? t(`refused.${r.reason}`) : t("refused.unavailable"));
  }

  return (
    <div className={styles.talk} data-state={voice.state}>
      <p className={styles.aiChip} data-testid="ai-chip">
        {t("aiChip")}
      </p>

      <SayBubble text={line} locale={locale} replayLabel={tOnb("replay")} className={styles.say} />

      <div ref={body} className={styles.body}>
        <Mascot pose={pose} label={tOnb("aiSign")} sizes="40vmin" className={styles.mascot} />
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.mic} data-live={live || undefined} onClick={toggle} disabled={voice.state === "connecting"} data-testid="talk-toggle">
          {live ? <Square size={36} aria-hidden fill="currentColor" /> : <Mic size={40} aria-hidden />}
          <span>{live ? t("stop") : t("start")}</span>
        </button>
        {secondsLeft !== null ? (
          <p className={styles.timeLeft} aria-live="off">
            {t("timeLeft", { minutes: Math.floor(secondsLeft / 60) })}
          </p>
        ) : null}
      </div>

      {card ? <TalkCard card={card} help={help} onClose={() => setCard(null)} /> : null}
    </div>
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
