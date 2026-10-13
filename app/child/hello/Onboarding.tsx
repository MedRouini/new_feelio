"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCalm } from "@/child/ui/useCalm";
import { ArrowLeft, ArrowRight, Check, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/child/ui/Avatar";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { NameSign } from "@/child/ui/NameSign";
import { SayBubble } from "@/child/ui/SayBubble";
import { ThingButton } from "@/child/ui/ThingButton";
import { play } from "@/child/ui/sound";
import uiStyles from "@/child/ui/ui.module.css";
import { MAX_INTERESTS, type Avatar as AvatarChoice, type Interest } from "@/child/options";
import { AssetImage } from "@/design/components/AssetImage";
import { AVATAR_COLOURS, type AssetId } from "@/design/asset-ids";
import { Carousel } from "./Carousel";
import { LikesPicker } from "./LikesPicker";
import { NamePicker, nameChoices } from "./NamePicker";
import { Sparkles } from "./Sparkles";
import styles from "./onboarding.module.css";

// Onboarding "Arriving in Feelio's world" (docs/ONBOARDING.md, redesign D-069). One continuous scene:
// the meadow never reloads; the camera walks toward the gate stop by stop and Feelio walks along.
// Choices give instant feedback but never advance on their own: the "go on" stone appears once there
// is a choice. Saved on the server after each stop (resumable). Only fixed-list values are ever sent.

type Stop = "hello" | "character" | "name" | "likes" | "mic" | "gate";
const ORDER: Stop[] = ["hello", "character", "name", "likes", "mic", "gate"];
type Colour = (typeof AVATAR_COLOURS)[number];

/** How close the camera is to the gate at each stop (scale of the meadow picture). */
const ZOOM: Record<Stop, number> = { hello: 1, character: 1.04, name: 1.08, likes: 1.12, mic: 1.15, gate: 1.18 };
const PUSH_ZOOM = 2.6;
const WALK_MS = 650;

type Props = {
  locale: "en" | "ar";
  startStep: number;
  avatar: AvatarChoice;
  talkEnabled: boolean;
  parentNickname: string | null;
};

async function save(body: Record<string, unknown>) {
  const res = await fetch("/api/child/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return res.ok;
}

export function Onboarding({ locale, startStep, avatar: initialAvatar, talkEnabled, parentNickname }: Props) {
  const t = useTranslations("child.onb");
  const tc = useTranslations("colours");
  const ti = useTranslations("interests");
  const router = useRouter();
  const reduce = useCalm();
  const rtl = locale === "ar";

  const stops = ORDER.filter((s) => s !== "mic" || talkEnabled);
  const resumeAt = (): Stop => {
    const s = ORDER[Math.min(startStep, ORDER.length - 1)];
    return s === "mic" && !talkEnabled ? "gate" : s;
  };

  const entry = (st: Stop): { line: { text: string; key: string }; pose: MascotPose } => {
    switch (st) {
      case "hello":
        return { line: { text: t("hello"), key: "onb_hello" }, pose: "mascot_waving" };
      case "character":
        return { line: { text: t("pickColour"), key: "onb_pickColour" }, pose: "mascot_pointing" };
      case "name":
        return { line: { text: t("pickName"), key: "onb_pickName" }, pose: "mascot_pointing" };
      case "likes":
        return { line: { text: t("likes"), key: "onb_likes" }, pose: "mascot_pointing" };
      case "mic":
        return { line: { text: t("micAsk"), key: "onb_micAsk" }, pose: "mascot_listening" };
      case "gate":
        return { line: { text: talkEnabled ? t("gate") : `${t("micOff")} ${t("gate")}`, key: talkEnabled ? "onb_gate" : "" }, pose: "mascot_happy" };
    }
  };

  const [stop, setStop] = useState<Stop>(resumeAt);
  const [walking, setWalking] = useState(false);
  const [line, setLine] = useState(() => entry(resumeAt()).line);
  const [pose, setPose] = useState<MascotPose>(() => entry(resumeAt()).pose);
  const [busy, setBusy] = useState(false);

  const [avatar, setAvatar] = useState<AvatarChoice>(initialAvatar);
  const [touched, setTouched] = useState(false);
  const [burst, setBurst] = useState(0);
  const [nickname, setNickname] = useState<{ key: string; word: string } | null>(null);
  const [likes, setLikes] = useState<Interest[]>([]);
  const [mic, setMic] = useState<"ask" | "listening" | "heard" | "no">("ask");
  const [level, setLevel] = useState(0);
  const [gate, setGate] = useState<"closed" | "opening" | "push">("closed");
  const stopMic = useRef<() => void>(() => undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => () => {
    stopMic.current();
    timers.current.forEach(clearTimeout);
  }, []);

  /** Feelio reacts for a moment (a happy pose), then goes back to the stop's pose. */
  const react = (text: string, key = "") => {
    setLine({ text, key });
    setPose("mascot_happy");
    later(1100, () => setPose(entry(stop).pose));
  };

  /** Saves this stop, then walks to the next one: contents leave, the camera moves, Feelio walks. */
  const go = async (body: Record<string, unknown> = {}) => {
    if (busy) return;
    const i = stops.indexOf(stop);
    const next = stops[i + 1];
    setBusy(true);
    const ok = await save({ step: ORDER.indexOf(next ?? "gate"), ...body });
    setBusy(false);
    if (!ok || !next) return;
    play("whoosh");
    stopMic.current();
    if (reduce) {
      setStop(next);
      setLine(entry(next).line);
      setPose(entry(next).pose);
      return;
    }
    setWalking(true);
    setPose(rtl ? "mascot_walking_left" : "mascot_walking_right");
    later(WALK_MS, () => {
      setWalking(false);
      setStop(next);
      setLine(entry(next).line);
      setPose(entry(next).pose);
    });
  };

  const skip = async () => {
    stopMic.current();
    await save({ step: ORDER.length, skip: true });
    router.replace("/");
  };

  // ---------- stop: character ----------
  const colourIndex = Math.max(0, AVATAR_COLOURS.indexOf(avatar.colour as Colour));
  const pickColour = (i: number) => {
    const colour = AVATAR_COLOURS[i];
    setAvatar((a) => ({ ...a, colour }));
    setTouched(true);
    setBurst((b) => b + 1);
    play("pick");
    react(t("colourNice", { colour: tc(colour) }));
  };

  // ---------- stop: name ----------
  const names = nameChoices(locale, parentNickname);
  const pickName = (n: { key: string; word: string }) => {
    setNickname(n);
    setBurst((b) => b + 1);
    play("pick");
    react(t("nameHello", { name: n.word }));
  };

  // ---------- stop: likes ----------
  const toggleLike = (id: Interest) => {
    if (likes.includes(id)) {
      setLikes((l) => l.filter((x) => x !== id));
      play("tap");
      return;
    }
    if (likes.length >= MAX_INTERESTS) {
      react(t("likesFull"));
      return;
    }
    setLikes((l) => [...l, id]);
    setBurst((b) => b + 1);
    play("pick");
    react(ti(id));
  };

  // ---------- stop: mic (local-only test; nothing is sent anywhere) ----------
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let raf = 0;
      let heard = false;
      setMic("listening");
      setLine({ text: t("micSay"), key: "onb_micSay" });
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(1, peak / 64));
        if (!heard && peak > 28) {
          heard = true;
          setMic("heard");
          setPose("mascot_happy");
          setLine({ text: t("micHeard"), key: "onb_micHeard" });
          setBurst((b) => b + 1);
          play("pick");
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
      stopMic.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((tr) => tr.stop());
        void ctx.close();
        setLevel(0);
      };
    } catch {
      setMic("no");
      setLine({ text: t("micNo"), key: "onb_micNo" });
    }
  };

  // ---------- stop: gate, entering the world ----------
  const leave = () => router.replace("/?arrive=1");
  const openGate = async () => {
    if (busy || gate !== "closed") return;
    setBusy(true);
    const ok = await save({ step: ORDER.length });
    if (!ok) {
      setBusy(false);
      return;
    }
    play("unlock");
    setGate("opening");
    setPose("mascot_pointing");
    setLine({ text: t("welcome"), key: "onb_welcome" });
    if (reduce) return later(1200, leave);
    later(1300, () => setGate("push"));
    later(2400, leave);
  };

  const zoom = gate === "push" ? PUSH_ZOOM : ZOOM[stop];
  const NextIcon = rtl ? ArrowLeft : ArrowRight;
  const shown = walking ? null : stop;
  const stage = (key: string, children: React.ReactNode) => (
    <motion.div
      key={key}
      className={styles.stopBox}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 26 }}
    >
      {children}
    </motion.div>
  );

  return (
    <main className={styles.scene} data-testid="onboarding" data-stop={stop} data-gate={gate}>
      {/* The meadow and its camera. Both pictures are approved art; the open one cross-fades in whole. */}
      <div className={styles.camera} style={{ ["--zoom" as string]: String(zoom) }} data-push={gate === "push" || undefined}>
        {(["land", "port"] as const).map((o) => (
          <div key={o} className={uiStyles.sceneBg} data-orient={o}>
            <AssetImage id={o === "land" ? "scene_meadow_land" : "scene_meadow_port"} alt="" sizes="100vw" className={uiStyles.sceneImg} priority />
            <AssetImage
              id={(o === "land" ? "scene_meadow_land_open" : "scene_meadow_port_open") as AssetId}
              alt=""
              sizes="100vw"
              className={[uiStyles.sceneImg, styles.openScene].join(" ")}
              style={{ opacity: gate === "closed" ? 0 : 1 }}
            />
          </div>
        ))}
        <span className={styles.gateGlow} data-on={gate !== "closed" || undefined} aria-hidden />
      </div>
      {gate === "push" ? <button type="button" className={styles.pushVeil} onClick={leave} aria-label={t("openGate")} /> : null}

      <ol className={styles.progress} aria-label={t("progress", { n: stops.indexOf(stop) + 1, total: stops.length })}>
        {stops.map((s, i) => {
          const at = stops.indexOf(stop);
          const art: AssetId = i < at ? "node_completed" : i === at ? "node_current" : "node_locked";
          return (
            <li key={s} data-state={i < at ? "done" : i === at ? "now" : "next"}>
              <AssetImage id={art} alt="" sizes="40px" />
            </li>
          );
        })}
      </ol>

      <div className={styles.say}>
        <SayBubble text={line.text} audioKey={line.key || undefined} locale={locale} replayLabel={t("replay")} testId="onb-line" />
      </div>

      <div className={styles.mascotSpot} data-walking={walking || undefined}>
        <Mascot pose={pose} label={t("aiSign")} className={[styles.mascot, mic === "heard" ? uiStyles.wobble : ""].join(" ")} sizes="36vmin" onTap={() => (stop === "hello" ? void go() : undefined)} />
      </div>

      <div className={styles.stage}>
        <AnimatePresence mode="wait">
          {shown === "hello"
            ? stage(
                "hello",
                <GoStone label={t("next")} onPress={() => void go()} testId="onb-next">
                  <NextIcon size={44} strokeWidth={3.5} />
                </GoStone>,
              )
            : null}

          {shown === "character"
            ? stage(
                "character",
                <>
                  <Carousel
                    items={AVATAR_COLOURS}
                    index={colourIndex}
                    onIndex={pickColour}
                    rtl={rtl}
                    spacing={0.3}
                    label={t("characterLabel")}
                    itemLabel={(c) => tc(c)}
                    prevLabel={t("prevOne")}
                    nextLabel={t("nextOne")}
                    testId="character-picker"
                    render={(c, centre) => (
                      <span className={styles.charSlide}>
                        {centre ? <AssetImage id="node_current" alt="" sizes="30vmin" className={styles.podium} /> : null}
                        <span className={styles.charBody} key={centre ? `${c}-${burst}` : c} data-hop={centre && touched ? true : undefined}>
                          <Avatar avatar={{ ...avatar, colour: c }} sizes="34vmin" />
                        </span>
                        {centre ? <Sparkles burst={burst} /> : null}
                      </span>
                    )}
                  />
                  <GoStone show={touched} label={t("thatsMe")} onPress={() => void go({ avatar })} testId="onb-next">
                    <Check size={44} strokeWidth={3.5} />
                  </GoStone>
                </>,
              )
            : null}

          {shown === "name"
            ? stage(
                "name",
                <div className={styles.nameStop}>
                  <NamePicker names={names} pickedKey={nickname?.key ?? null} onPick={pickName} label={t("pickName")} />
                  <div className={styles.nameMe}>
                    <span className={styles.nameAvatar} key={burst} data-hop={nickname ? true : undefined}>
                      <Avatar avatar={avatar} sizes="22vmin" />
                    </span>
                    <AnimatePresence mode="popLayout">
                      {nickname ? (
                        <motion.div key={nickname.key} initial={reduce ? { opacity: 0 } : { y: -60, opacity: 0, rotate: -6 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
                          <NameSign text={nickname.word} className={styles.nameSign} testId="chosen-name" />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    <GoStone show={!!nickname} label={t("thatsMe")} onPress={() => void go({ nickname: nickname?.key })} testId="onb-next">
                      <Check size={44} strokeWidth={3.5} />
                    </GoStone>
                  </div>
                </div>,
              )
            : null}

          {shown === "likes"
            ? stage(
                "likes",
                <div className={styles.likesStop}>
                  <LikesPicker likes={likes} onToggle={toggleLike} onCentre={(id) => setLine({ text: ti(id), key: "" })} rtl={rtl} burst={burst} />
                  <GoStone label={t("next")} onPress={() => void go({ interests: likes })} testId="onb-next">
                    <NextIcon size={44} strokeWidth={3.5} />
                  </GoStone>
                </div>,
              )
            : null}

          {shown === "mic"
            ? stage(
                "mic",
                <div className={styles.micStop}>
                  {mic !== "no" ? (
                    <span className={styles.micWrap} style={{ ["--level" as string]: String(level) }} data-live={mic !== "ask" || undefined}>
                      <span className={styles.micRing} aria-hidden />
                      <ThingButton art="ui_mic_object" label={t("micButton")} sizes="24vmin" className={styles.micObject} sound="pick" testId="mic" onPress={() => (mic === "ask" ? void startMic() : undefined)} />
                    </span>
                  ) : null}
                  <GoStone show={mic !== "ask" && mic !== "listening"} label={t("next")} onPress={() => void go()} testId="onb-next">
                    <NextIcon size={44} strokeWidth={3.5} />
                  </GoStone>
                  {mic === "ask" || mic === "listening" ? (
                    <button type="button" className={styles.later} onClick={() => void go()} data-testid="mic-later">
                      {t("micLater")}
                    </button>
                  ) : null}
                </div>,
              )
            : null}

          {shown === "gate"
            ? stage(
                "gate",
                <GoStone show={gate === "closed"} label={t("openGate")} onPress={() => void openGate()} testId="onb-gate">
                  <NextIcon size={44} strokeWidth={3.5} />
                </GoStone>,
              )
            : null}
        </AnimatePresence>
      </div>

      <button type="button" className={uiStyles.skip} onClick={() => void skip()} data-testid="onb-skip">
        <SkipForward size={22} aria-hidden style={rtl ? { transform: "scaleX(-1)" } : undefined} />
        {t("skip")}
      </button>
    </main>
  );
}

/** The "go on" stepping stone. It appears (a pop) only once there is something to confirm, then breathes. */
function GoStone({ show = true, label, onPress, testId, children }: { show?: boolean; label: string; onPress: () => void; testId: string; children: React.ReactNode }) {
  // The space is kept even while hidden, so nothing jumps when the stone appears.
  return (
    <div className={styles.goSlot}>
    <AnimatePresence>
      {show ? (
        <motion.div key="go" className={styles.goWrap} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
          <ThingButton art="node_current" label={label} sizes="128px" className={styles.goStone} onPress={onPress} testId={testId}>
            <span className={styles.goIcon} aria-hidden>
              {children}
            </span>
          </ThingButton>
        </motion.div>
      ) : null}
    </AnimatePresence>
    </div>
  );
}
