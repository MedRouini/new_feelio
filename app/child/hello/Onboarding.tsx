"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/child/ui/Avatar";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { NameSign } from "@/child/ui/NameSign";
import { SayBubble } from "@/child/ui/SayBubble";
import { ThingButton } from "@/child/ui/ThingButton";
import { play } from "@/child/ui/sound";
import uiStyles from "@/child/ui/ui.module.css";
import { COMPANIONS, INTERESTS, MAX_INTERESTS, NICKNAMES, type Avatar as AvatarChoice, type Interest } from "@/child/options";
import { AssetImage } from "@/design/components/AssetImage";
import { AVATAR_COLOURS, type AssetId } from "@/design/asset-ids";
import styles from "./onboarding.module.css";

// Onboarding "Arriving in Feelio's world" (docs/ONBOARDING.md). One scene, five stops, led by the mascot.
// Saved on the server after each stop (resumable). Only fixed-list values are ever sent.

type Stop = "hello" | "character" | "likes" | "mic" | "gate";
const STOPS: Stop[] = ["hello", "character", "likes", "mic", "gate"];
type CharPart = "colour" | "companion" | "name";

type Props = {
  locale: "en" | "ar";
  startStep: number;
  avatar: AvatarChoice;
  talkEnabled: boolean;
  parentNickname: string | null;
};

async function save(body: Record<string, unknown>) {
  const res = await fetch("/api/child/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export function Onboarding({ locale, startStep, avatar: initialAvatar, talkEnabled, parentNickname }: Props) {
  const t = useTranslations("child.onb");
  const tc = useTranslations("colours");
  const tco = useTranslations("companions");
  const ti = useTranslations("interests");
  const router = useRouter();

  // What Feelio says and how it stands at each stop (set in the handlers that change the stop).
  const entryFor = (st: Stop, pt: CharPart): { line: { text: string; key: string }; pose: MascotPose } => {
    if (st === "hello") return { line: { text: t("hello"), key: "onb_hello" }, pose: "mascot_waving" };
    if (st === "character") {
      const k = pt === "colour" ? "pickColour" : pt === "companion" ? "pickCompanion" : "pickName";
      return { line: { text: t(k), key: `onb_${k}` }, pose: "mascot_pointing" };
    }
    if (st === "likes") return { line: { text: t("likes"), key: "onb_likes" }, pose: "mascot_pointing" };
    if (st === "mic") {
      return {
        line: talkEnabled ? { text: t("micAsk"), key: "onb_micAsk" } : { text: t("micOff"), key: "onb_micOff" },
        pose: "mascot_listening",
      };
    }
    return { line: { text: t("gate"), key: "onb_gate" }, pose: "mascot_happy" };
  };
  const initialStop = STOPS[Math.min(startStep, STOPS.length - 1)];
  const [stop, setStop] = useState<Stop>(initialStop);
  const [part, setPart] = useState<CharPart>("colour");
  const [avatar, setAvatar] = useState<AvatarChoice>(initialAvatar);
  const [cheer, setCheer] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [likes, setLikes] = useState<Interest[]>([]);
  const [line, setLine] = useState(() => entryFor(initialStop, "colour").line);
  const [pose, setPose] = useState<MascotPose>(() => entryFor(initialStop, "colour").pose);
  const enter = (st: Stop, pt: CharPart) => {
    const e = entryFor(st, pt);
    setLine(e.line);
    setPose(e.pose);
  };
  const [mic, setMic] = useState<"ask" | "listening" | "heard" | "no">("ask");
  const [gateOpen, setGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const stopMic = useRef<() => void>(() => undefined);

  useEffect(() => () => stopMic.current(), []);

  const go = async (next: Stop, body: Record<string, unknown>) => {
    setBusy(true);
    const ok = await save(body);
    setBusy(false);
    if (ok) {
      play("whoosh");
      setStop(next);
      enter(next, "colour");
    }
  };

  const skip = async () => {
    stopMic.current();
    await save({ step: STOPS.length, skip: true });
    router.replace("/");
  };

  // ---------- stop 2 helpers ----------
  const choose = (patch: Partial<AvatarChoice>, nextPart: CharPart | null) => {
    setAvatar((a) => ({ ...a, ...patch }));
    setCheer(true);
    setTimeout(() => {
      setCheer(false);
      if (nextPart) {
        setPart(nextPart);
        enter("character", nextPart);
      }
    }, 900);
  };
  const chooseName = async (key: string, word: string) => {
    setNickname(key);
    setLine({ text: t("nameHello", { name: word }), key: "" });
    setCheer(true);
    setTimeout(() => setCheer(false), 900);
  };

  // ---------- stop 4: local-only microphone test (nothing is sent anywhere) ----------
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
        if (!heard && peak > 28) {
          heard = true;
          setMic("heard");
          setPose("mascot_happy");
          setLine({ text: t("micHeard"), key: "onb_micHeard" });
          play("pick");
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
      stopMic.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((tr) => tr.stop());
        void ctx.close();
      };
    } catch {
      setMic("no");
      setLine({ text: t("micNo"), key: "onb_micNo" });
    }
  };

  const gateArt: { land: AssetId; port: AssetId } = gateOpen
    ? { land: "scene_meadow_land_open", port: "scene_meadow_port_open" }
    : { land: "scene_meadow_land", port: "scene_meadow_port" };

  const nextLabel = t("next");
  const NextIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <main className={styles.scene} data-testid="onboarding" data-stop={stop}>
      {/* the welcome meadow; the gate-open version is revealed only around the gate (stop 5) */}
      <div className={uiStyles.sceneBg} data-orient="land">
        <AssetImage id="scene_meadow_land" alt="" sizes="100vw" className={uiStyles.sceneImg} priority />
      </div>
      <div className={uiStyles.sceneBg} data-orient="port">
        <AssetImage id="scene_meadow_port" alt="" sizes="100vw" className={uiStyles.sceneImg} priority />
      </div>
      {gateOpen ? (
        <>
          <div className={`${uiStyles.sceneBg} ${styles.gateReveal}`} data-orient="land">
            <AssetImage id={gateArt.land} alt="" sizes="100vw" className={uiStyles.sceneImg} />
          </div>
          <div className={`${uiStyles.sceneBg} ${styles.gateReveal}`} data-orient="port">
            <AssetImage id={gateArt.port} alt="" sizes="100vw" className={uiStyles.sceneImg} />
          </div>
        </>
      ) : null}

      <div className={styles.say}>
        <SayBubble text={line.text} audioKey={line.key || undefined} locale={locale} replayLabel={t("replay")} />
      </div>

      <div className={styles.mascotSpot}>
        {stop === "hello" ? <NameSign text={t("aiSign")} className={styles.aiSign} testId="ai-sign" /> : null}
        <Mascot
          pose={pose}
          label={t("aiSign")}
          className={[styles.mascot, mic === "heard" ? uiStyles.wobble : ""].join(" ")}
          sizes="36vmin"
          onTap={() => {
            if (stop === "hello") void go("character", { step: 1 });
          }}
        />
      </div>

      <div className={styles.stage}>
        {stop === "hello" ? (
          <ThingButton art="node_current" label={nextLabel} sizes="120px" className={styles.goStone} onPress={() => void go("character", { step: 1 })} testId="onb-next">
            <span className={styles.goIcon} aria-hidden>
              <NextIcon size={44} strokeWidth={3.5} />
            </span>
          </ThingButton>
        ) : null}

        {stop === "character" ? (
          <div className={styles.character}>
            <Avatar avatar={avatar} cheer={cheer} sizes="34vmin" className={styles.preview} />
            <div className={styles.choices} data-part={part}>
              {part === "colour"
                ? AVATAR_COLOURS.map((colour) => (
                    <ThingButton key={colour} art={`avatar_${avatar.shape}_${colour}_idle`} label={tc(colour)} sizes="16vmin" className={styles.choice}
                      pressed={avatar.colour === colour} sound="pick" testId={`colour-${colour}`} onPress={() => choose({ colour }, "companion")} />
                  ))
                : null}
              {part === "companion"
                ? COMPANIONS.map((companion) => (
                    <ThingButton key={companion} art={`companion_${companion}`} label={tco(companion)} sizes="16vmin" className={styles.choice}
                      pressed={avatar.companion === companion} sound="pick" testId={`companion-${companion}`} onPress={() => choose({ companion }, "name")} />
                  ))
                : null}
              {part === "name" ? (
                <>
                  {parentNickname ? (
                    <ThingButton art="ui_sign_plate" label={parentNickname} sizes="24vmin" className={styles.nameChoice} pressed={nickname === "parent"} sound="pick"
                      testId="name-parent" onPress={() => void chooseName("parent", parentNickname)}>
                      <span className={styles.nameText} aria-hidden>{parentNickname}</span>
                    </ThingButton>
                  ) : null}
                  {NICKNAMES.slice(0, parentNickname ? 5 : 6).map((n) => (
                    <ThingButton key={n.key} art="ui_sign_plate" label={n[locale]} sizes="24vmin" className={styles.nameChoice} pressed={nickname === n.key} sound="pick"
                      testId={`name-${n.key}`} onPress={() => void chooseName(n.key, n[locale])}>
                      <span className={styles.nameText} aria-hidden>{n[locale]}</span>
                    </ThingButton>
                  ))}
                </>
              ) : null}
            </div>
            {part === "name" && nickname ? (
              <ThingButton art="node_current" label={nextLabel} sizes="120px" className={styles.goStone} testId="onb-next"
                onPress={() => void go("likes", { step: 2, avatar, nickname })}>
                <span className={styles.goIcon} aria-hidden><NextIcon size={44} strokeWidth={3.5} /></span>
              </ThingButton>
            ) : null}
          </div>
        ) : null}

        {stop === "likes" ? (
          <div className={styles.likes}>
            <div className={styles.likeGrid}>
              {INTERESTS.map((id) => {
                const on = likes.includes(id);
                return (
                  <ThingButton key={id} art={`like_${id}`} label={ti(id)} sizes="16vmin" className={styles.like} pressed={on} sound="pick" testId={`like-${id}`}
                    onPress={() => {
                      setLine({ text: ti(id), key: "" });
                      setLikes((l) => (on ? l.filter((x) => x !== id) : l.length < MAX_INTERESTS ? [...l, id] : l));
                    }} />
                );
              })}
            </div>
            <ThingButton art="node_current" label={nextLabel} sizes="120px" className={styles.goStone} testId="onb-next"
              onPress={() => void go("mic", { step: 3, interests: likes })}>
              <span className={styles.goIcon} aria-hidden><NextIcon size={44} strokeWidth={3.5} /></span>
            </ThingButton>
          </div>
        ) : null}

        {stop === "mic" ? (
          <div className={styles.mic}>
            {talkEnabled && mic === "ask" ? (
              <ThingButton art="ui_mic_object" label={t("micButton")} sizes="22vmin" className={styles.micObject} sound="pick" testId="mic" onPress={() => void startMic()} />
            ) : null}
            <ThingButton art="node_current" label={nextLabel} sizes="120px" className={styles.goStone} testId="onb-next"
              onPress={() => {
                stopMic.current();
                void go("gate", { step: 4 });
              }}>
              <span className={styles.goIcon} aria-hidden><NextIcon size={44} strokeWidth={3.5} /></span>
            </ThingButton>
          </div>
        ) : null}

        {stop === "gate" ? (
          <ThingButton art="node_current" label={t("openGate")} sizes="120px" className={styles.goStone} testId="onb-gate" sound="unlock"
            onPress={async () => {
              if (busy) return;
              setGateOpen(true);
              setLine({ text: t("welcome"), key: "onb_welcome" });
              const ok = await save({ step: STOPS.length });
              if (ok) setTimeout(() => router.replace("/?arrive=1"), 1400);
            }}>
            <span className={styles.goIcon} aria-hidden><NextIcon size={44} strokeWidth={3.5} /></span>
          </ThingButton>
        ) : null}
      </div>

      <button type="button" className={uiStyles.skip} onClick={() => void skip()} data-testid="onb-skip">
        <SkipForward size={22} aria-hidden style={locale === "ar" ? { transform: "scaleX(-1)" } : undefined} />
        {t("skip")}
      </button>
    </main>
  );
}

