"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCalm } from "@/child/ui/useCalm";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { ActionObject } from "@/child/ui/ActionObject";
import { Caption } from "@/child/ui/Caption";
import { Pressable } from "@/child/ui/Pressable";
import uiStyles from "@/child/ui/ui.module.css";
import { AssetImage } from "@/design/components/AssetImage";
import { isDelivered } from "@/design/assets";
import { FEELING_FACE, LOADING_BEAT, OFFER_ART, TALK_MASCOT, pick, pickOptional, placeArrival } from "@/design/asset-slots";
import { EMPTY_ROOM, acceptOffer, closeHelp, dismissOffer, endRun, hold, release, roomPhase, startsByVoice, withTool, type Offer, type Room } from "@/child/talkRoom";
import type { Run } from "@/child/activities";
import { VoiceProvider, useFeelioVoice, type GameReport } from "@/safety/voice-agent/useVoice";
import { TOOL_ARGS, parseToolCall, type ToolCall, type ToolName } from "@/safety/voice-agent/tools";
import { ActivityStage } from "./ActivityStage";
import styles from "./talk.module.css";

// Talk (D-068, D-069, voice room D-076): Feelio's cosy nook. Feelio is the heart of the room and the
// microphone object is the one thing to tap. The room shows what Feelio is doing with Feelio itself
// (listening, thinking, talking with its mouth, feeling with the child), not with text. Feelio can
// offer a calm activity or a story. During a live talk, the child's yes starts the game by itself (once
// Feelio has finished its sentence), and the game is part of the same conversation (D-077): the
// microphone stays open, Feelio is told what is happening in the game, the game waits while Feelio
// speaks, and the child can ask Feelio to stop it. Without a live talk the offer waits beside Feelio for
// a tap. A story or a place is a door to tap.

type Place = { id: string; name: string; open: boolean };
type Help = { kind: string; text: string };
type Mood = "happy" | "excited" | "empathy" | "calm";

/** A mood from the companion shows this long, then Feelio follows the talk again. */
const MOOD_MS = 8000;
/** The pause between Feelio's last word and the game starting by voice. */
const START_BEAT_MS = 400;
/** After a game during a live talk, the cheer plays this long before the room goes back to the talk. */
const BACK_TO_TALK_MS = 4000;
/** After Feelio's last word during a game, a short beat, then the game goes on. */
const RESUME_BEAT_MS = 700;
/** A feeling picture stays beside Feelio this long. */
const FEELING_MS = 12_000;
const MOUTH = ["mascot_speaking_closed", "mascot_speaking_half", "mascot_speaking_open"] as const;
const ALL_TOOLS = Object.keys(TOOL_ARGS) as ToolName[];
/** Feelio's voice sparkles: brand companions (approved art), each with its own lane, pace and size. */
const SPARKS: { id: "companion_star" | "companion_heart" | "companion_cloud"; x: string; y?: string; d: number; s: number }[] = [
  { id: "companion_star", x: "-34%", y: "42%", d: 2.6, s: 0.9 },
  { id: "companion_heart", x: "-18%", y: "66%", d: 3.1, s: 0.7 },
  { id: "companion_cloud", x: "0%", y: "30%", d: 2.8, s: 1 },
  { id: "companion_star", x: "17%", y: "70%", d: 3.4, s: 0.65 },
  { id: "companion_heart", x: "32%", y: "46%", d: 2.5, s: 0.85 },
];

export function TalkScreen(props: { places: Place[]; help: Help[]; stories: boolean }) {
  return (
    <VoiceProvider>
      <Talk {...props} />
    </VoiceProvider>
  );
}

function Talk({ places, help, stories }: { places: Place[]; help: Help[]; stories: boolean }) {
  const t = useTranslations("child.talk");
  const tOnb = useTranslations("child.onb");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const reduce = useCalm();
  const [room, setRoom] = useState<Room>(EMPTY_ROOM);
  const [mood, setMood] = useState<{ mood: Mood; until: number } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  /** Back from an activity without talking yet: the room invites, instead of saying goodbye. */
  const [rested, setRested] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [mouth, setMouth] = useState(0);

  const can = useRef({ places: places.filter((p) => p.open).map((p) => p.id), stories });
  const onTool = useCallback((call: ToolCall) => {
    if (call.name === "set_mascot_state") return setMood({ mood: call.args.mood, until: Date.now() + MOOD_MS });
    setRoom((r) => withTool(r, call, can.current));
  }, []);
  const voice = useFeelioVoice({ onTool });
  const { state, outputVolume, inputVolume } = voice;
  const live = state === "connecting" || state === "listening" || state === "thinking" || state === "speaking";
  const phase = roomPhase(state, problem, room);
  const nookLand = pickOptional(["scene_talk_nook_land"] as const);
  const nookPort = pickOptional(["scene_talk_nook_port"] as const);
  const nook = nookLand && nookPort ? { land: nookLand, port: nookPort } : null;

  // Development and tests only (never in a production bundle): hand the screen a tool call the way the
  // agent would, through the same validation, so the room can be tested without spending a live call.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __feelioTool?: (name: string, args: unknown) => boolean };
    w.__feelioTool = (name, args) => {
      const call = parseToolCall(name, args, ALL_TOOLS);
      if (call) onTool(call);
      return Boolean(call);
    };
    return () => void delete w.__feelioTool;
  }, [onTool]);

  useEffect(() => {
    if (!voice.deadline && !mood) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [voice.deadline, mood]);

  // A feeling picture fades after a while.
  useEffect(() => {
    if (!room.feeling) return;
    const id = setTimeout(() => setRoom((r) => ({ ...r, feeling: null })), FEELING_MS);
    return () => clearTimeout(id);
  }, [room.feeling]);

  // Whoever speaks makes the room breathe: a CSS variable set every frame, no re-render (the lamp and
  // sparkles follow Feelio's voice; the microphone glows with the child's). Feelio's mouth follows its voice.
  const rootRef = useRef<HTMLDivElement>(null);
  const hasMouth = MOUTH.every(isDelivered);
  useEffect(() => {
    const el = rootRef.current;
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
    if (moodNow && live && state !== "connecting") return pick(TALK_MASCOT[moodNow]);
    if (state === "speaking") return hasMouth ? MOUTH[mouth] : pick(TALK_MASCOT.speaking);
    if (state === "thinking" || state === "connecting") return pick(TALK_MASCOT.connecting);
    if (state === "listening") return pick(TALK_MASCOT.listening);
    // Feelio points at what it offered (the offer always stands to Feelio's right, never mirrored).
    if (room.offer) return "mascot_pointing";
    if (state === "ended" && !rested) return "mascot_waving";
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
        return rested ? t("intro") : t("ended");
      case "lost":
        return t("lost");
    }
  })();

  const left = voice.deadline ? Math.max(0, (voice.deadline - now) / 1000) : null;
  const share = left !== null && voice.allowed ? left / voice.allowed : 1;

  async function talk(after = room.after) {
    if (live) return;
    setProblem(null);
    setRested(false);
    setRoom((r) => ({ ...dismissOffer(r), feeling: null, after: null }));
    const r = await voice.start(undefined, after);
    if (!r.ok) setProblem(r.reason);
  }
  function toggle() {
    if (live) return voice.stop();
    void talk();
  }

  /** The child taps what Feelio offered (a live talk stays open). */
  function startOffer() {
    if (room.offer?.kind !== "activity" || room.offer.activity === "story") return;
    setProblem(null);
    setRoom((r) => acceptOffer(r, Date.now()));
  }

  // A yes in the talk starts the game: Feelio called offer_activity after the child's yes, so it starts
  // as soon as Feelio has finished its sentence.
  const voiceStart = startsByVoice(room, state);
  useEffect(() => {
    if (!voiceStart) return;
    // a short beat after Feelio's last word, then the game begins
    const id = setTimeout(() => setRoom((r) => acceptOffer(r, Date.now())), START_BEAT_MS);
    return () => clearTimeout(id);
  }, [voiceStart]);

  // One conversation (D-077): while Feelio speaks during a game, the game waits (clock and recorded line),
  // then goes on a beat after Feelio's last word. The microphone stays open the whole time.
  const playing = Boolean(room.run);
  const speaking = live && state === "speaking";
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setRoom((r) => (speaking ? hold(r, Date.now()) : release(r, Date.now()))), speaking ? 0 : RESUME_BEAT_MS);
    return () => clearTimeout(id);
  }, [playing, speaking]);

  // Feelio is told what is happening in the game (ids and numbers only), so its words fit it. A game
  // that ends early is reported as stopped. Waiting for Feelio is not the child's pause.
  const { game } = voice;
  const reported = useRef<{ key: string; run: Run | null }>({ key: "", run: null });
  useEffect(() => {
    const { key: before, run: prev } = reported.current;
    const run = room.run;
    let r: GameReport | null = null;
    if (run) r = { activity: run.activity, step: run.step, status: room.held ? "running" : run.status, found: run.found };
    else if (prev && prev.status !== "done") r = { activity: prev.activity, step: prev.step, status: "stopped", found: prev.found };
    const key = r ? JSON.stringify(r) : "";
    reported.current = { key, run };
    if (live && r && key !== before) game(r);
  }, [live, room.run, room.held, game]);

  // Finished during a live talk: a short cheer, then straight back to the same conversation.
  const doneLive = live && room.run?.status === "done";
  useEffect(() => {
    if (!doneLive) return;
    const id = setTimeout(() => setRoom((r) => ({ ...endRun(r), after: null })), BACK_TO_TALK_MS);
    return () => clearTimeout(id);
  }, [doneLive]);
  const updateRun = useCallback(
    (f: (r: Run) => Run) =>
      setRoom((r) => {
        if (!r.run) return r;
        const run = f(r.run);
        // the child's own Keep going (or Next) takes over from waiting for Feelio
        return { ...r, run, held: r.held && run.status === "paused" };
      }),
    [],
  );
  const exitRun = useCallback(() => {
    setRested(true);
    // during a live talk the conversation simply goes on (nothing to tell the next talk)
    setRoom((r) => (live ? { ...endRun(r), after: null } : endRun(r)));
  }, [live]);
  function talkAfterRun() {
    const after = room.run?.status === "done" ? room.run.activity : room.after;
    setRoom(endRun);
    void talk(after);
  }

  // Keyboard and screen readers: entering or leaving an activity moves focus to its main control.
  const inActivity = phase === "activity";
  const wasInActivity = useRef<boolean | null>(null);
  useEffect(() => {
    // only when the child moves between the talk and an activity (not on arrival, and not on a re-run)
    const before = wasInActivity.current;
    wasInActivity.current = inActivity;
    if (before === null || before === inActivity) return;
    // the layers cross-fade one after the other, so wait for the control to be there (at most ~1 s)
    let raf = 0;
    let tries = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-testid="${inActivity ? "activity-pause" : "talk-toggle"}"]`);
      if (el) el.focus({ preventScroll: true });
      else if (tries++ < 60) raf = requestAnimationFrame(find);
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [inActivity]);

  const retry = state === "lost" || problem !== null;
  const micLabel = live ? t("stop") : retry ? t("tryAgain") : state === "ended" && !rested ? t("talkAgain") : t("start");

  return (
    <div ref={rootRef} className={styles.room} data-state={phase} data-mood={moodNow ?? undefined} data-testid="talk-room">
      {/* Feelio's cosy nook (approved scene art); a warm dusk in flat brand colours until it is delivered. */}
      {nook ? (
        (["land", "port"] as const).map((o) => (
          <div key={o} className={uiStyles.sceneBg} data-orient={o} aria-hidden>
            <AssetImage id={o === "land" ? nook.land : nook.port} alt="" sizes="100vw" className={uiStyles.sceneImg} priority />
          </div>
        ))
      ) : (
        <div className={styles.dusk} aria-hidden />
      )}
      {/* calm mode: the lamp dims for an activity */}
      <div className={styles.hush} aria-hidden />

      {/* The one AI notice in Talk (owner decision 2026-10-12): a quiet line, no badge. */}
      <p className={styles.aiLine} data-testid="ai-chip">
        {t("aiChip")}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {room.run ? (
          <motion.div
            key="activity"
            className={styles.layer}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
            transition={{ duration: reduce ? 0.15 : 0.35, ease: "easeOut" }}
          >
            <ActivityStage run={room.run} held={room.held} feelio={voice.caption} update={updateRun} onExit={exitRun} onTalk={talkAfterRun} canTalk={!live && !problem} locale={locale} calm={reduce} />
          </motion.div>
        ) : (
          <motion.div
            key="talk"
            className={styles.layer}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: reduce ? 0.15 : 0.35, ease: "easeOut" }}
          >
            <div className={styles.stageRow} data-side={room.offer || room.feeling ? true : undefined}>
              <div className={styles.feelingSpot}>
                <AnimatePresence>
                  {room.feeling ? (
                    <motion.figure
                      key={room.feeling}
                      className={styles.feeling}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 20 }}
                      data-testid="feeling"
                    >
                      <AssetImage id={pick(FEELING_FACE[room.feeling])} alt="" sizes="22vmin" className={styles.face} />
                      <figcaption>{t(`feelings.${room.feeling}`)}</figcaption>
                    </motion.figure>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className={styles.hero}>
                <span className={styles.lamp} aria-hidden />
                <span className={styles.sparkles} aria-hidden>
                  {SPARKS.map((sp, i) => (
                    <AssetImage key={i} id={sp.id} alt="" sizes="48px" className={styles.spark} style={{ ["--x" as string]: sp.x, ["--y" as string]: sp.y ?? "55%", ["--d" as string]: `${sp.d}s`, ["--s" as string]: sp.s }} />
                  ))}
                </span>
                <div className={styles.body} data-bounce={state === "speaking" && !hasMouth ? true : undefined}>
                  <Mascot pose={pose} label={tOnb("aiSign")} sizes="50vmin" className={styles.mascot} />
                  {/* the mouth frames load up front (same sizes, so the same file), so lip-sync never blinks */}
                  {hasMouth ? (
                    <span className={styles.preload} aria-hidden>
                      {MOUTH.map((id) => (
                        <AssetImage key={id} id={id} alt="" sizes="50vmin" priority />
                      ))}
                    </span>
                  ) : null}
                </div>
                {state === "connecting" || state === "thinking" ? (
                  <span className={styles.beat} aria-hidden data-testid="thinking">
                    {LOADING_BEAT.map((id) => (
                      <AssetImage key={id} id={id} alt="" sizes="56px" className={styles.beatItem} />
                    ))}
                  </span>
                ) : null}
              </div>

              <div className={styles.offerSpot}>
                <AnimatePresence mode="wait">
                  {room.offer ? (
                    <motion.div
                      key={room.offer.kind === "place" ? `place-${room.offer.place}` : room.offer.activity}
                      className={styles.offer}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                      transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 240, damping: 22 }}
                    >
                      <OfferObject offer={room.offer} places={places} onStart={startOffer} />
                      <Pressable label={t("act.notNow")} icon={<X size={22} aria-hidden />} onPress={() => setRoom(dismissOffer)} className={styles.notNow} testId="offer-not-now" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <Caption text={line} audioKey={line === t("intro") ? "talk_intro" : undefined} locale={locale} replayLabel={tOnb("replay")} variant="float" className={styles.subtitle} testId="talk-words" />

            <div className={styles.controls}>
              <span className={styles.micWrap} data-live={live || undefined}>
                {left !== null ? <TimeArc share={share} late={left < 30} /> : null}
                <span className={styles.micGlow} aria-hidden />
                <ActionObject art="ui_mic_object" label={micLabel} ready={!live} loading={state === "connecting"} onPress={toggle} sizes="(orientation: portrait) 30vw, 150px" className={styles.mic} testId="talk-toggle" />
              </span>
              {left !== null ? <span className={styles.srOnly}>{t("timeLeft", { minutes: Math.floor(left / 60) })}</span> : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {room.help ? <HelpPanel kinds={room.help} help={help} onClose={() => setRoom(closeHelp)} /> : null}
    </div>
  );
}

/** What Feelio offered, as a big object to tap: a calm activity starts here, a story or a place is a page. */
function OfferObject({ offer, places, onStart }: { offer: Offer; places: Place[]; onStart: () => void }) {
  const t = useTranslations("child.talk");
  if (offer.kind === "place") {
    const place = places.find((p) => p.id === offer.place);
    const art = pickOptional(placeArrival(offer.place));
    if (!place) return null;
    return <ActionObject art={art ?? "dock_map"} label={t("visit", { place: place.name })} href={`/place/${place.id}`} ready sizes="24vmin" className={styles.offerArt} testId="offer" />;
  }
  if (offer.activity === "story")
    return <ActionObject art="ui_btn_make_story" label={t("act.offer.story")} href="/stories/make" ready sizes="24vmin" className={styles.offerArt} testId="offer" />;
  return <ActionObject art={pick(OFFER_ART[offer.activity])} label={t(`act.offer.${offer.activity}`)} ready onPress={onStart} sizes="24vmin" className={styles.offerArt} testId="offer" />;
}

/** Who can help (the router's crisis tool, never the model's). It stays until the child closes it. */
function HelpPanel({ kinds, help, onClose }: { kinds: string[]; help: Help[]; onClose: () => void }) {
  const t = useTranslations("child.talk");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className={styles.helpLayer}>
      <div ref={ref} tabIndex={-1} className={styles.help} role="alertdialog" aria-modal="true" aria-label={t("helpTitle")} data-testid="help">
        <Mascot pose={pick(TALK_MASCOT.empathy)} label={t("helpTitle")} sizes="20vmin" className={styles.helpMascot} />
        <h2>{t("helpTitle")}</h2>
        <ul>
          {help
            .filter((h) => kinds.includes(h.kind))
            .map((h) => (
              <li key={h.kind}>{h.text}</li>
            ))}
        </ul>
        <Pressable shape="round" label={t("close")} icon={<X size={28} aria-hidden />} onPress={onClose} className={styles.helpClose} testId="help-close" />
      </div>
    </div>
  );
}

/** Time left as an arc that empties around the microphone (amber in the last 30 seconds). No numbers. */
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
