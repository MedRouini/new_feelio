"use client";

// THROWAWAY SPIKE (v2, 2026-10-24): an interactive film made of full illustrated frames (Batch 11).
// Each shot is one approved picture with a slow camera move inside it, cross-fades between shots,
// light effects, two recorded voices (Feelio, Nori) with subtitles, and a choice with rewind.
// English only, hard-coded, no tests. Not product code.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, RotateCcw, Rewind } from "lucide-react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId, FilmFrameId } from "@/design/asset-ids";
import { play as sfx } from "@/child/ui/sound";
import styles from "./film.module.css";

/** Camera: zoom s (≥ 1) aimed at the point (x, y), in % of the picture from the top left. */
type Cam = { s: number; x: number; y: number };
function camTransform(c: Cam) {
  const clamp = (v: number) => Math.max(-50 * (c.s - 1), Math.min(50 * (c.s - 1), v));
  return { scale: c.s, x: `${clamp((50 - c.x) * c.s)}%`, y: `${clamp((50 - c.y) * c.s)}%` };
}

type Who = "F" | "N";
type Fx = { storm?: number; warm?: number; shake?: boolean; burst?: boolean };
type Step = { say: string; who: Who; text: string } | { wait: number } | { cam: Cam; dur: number } | { fx: Fx } | { sfx: "whoosh" | "pop" | "unlock" };
type Shot = { frame: FilmFrameId; from: Cam; to: Cam; dur: number; fade?: number; steps: Step[] };

const F = (say: string, text: string): Step => ({ say, who: "F", text });
const N = (say: string, text: string): Step => ({ say, who: "N", text });

const ACT1: Shot[] = [
  { frame: "film_tower_01_build", from: { s: 1.3, x: 50, y: 48 }, to: { s: 1.05, x: 50, y: 52 }, dur: 6, fade: 1.2, steps: [{ wait: 900 }, F("film_f01", "One more block… and… done!"), { wait: 300 }] },
  { frame: "film_tower_02_proud", from: { s: 1.0, x: 50, y: 50 }, to: { s: 1.12, x: 42, y: 45 }, dur: 5, steps: [{ sfx: "pop" }, F("film_f02", "Ta-da! The tallest tower I've ever built!"), { wait: 400 }] },
  { frame: "film_tower_03_nori_runs", from: { s: 1.15, x: 70, y: 45 }, to: { s: 1.05, x: 55, y: 50 }, dur: 5, steps: [N("film_n03", "Wow! A super tall tower!"), F("film_f03", "Nori, wait! Be careful!")] },
  { frame: "film_tower_04_bump", from: { s: 1.08, x: 50, y: 55 }, to: { s: 1.2, x: 50, y: 52 }, dur: 2.5, fade: 0.15, steps: [{ sfx: "whoosh" }, { fx: { shake: true } }, F("film_f04", "Oh no!"), { wait: 700 }] },
  { frame: "film_tower_05_fallen", from: { s: 1.2, x: 55, y: 60 }, to: { s: 1.0, x: 50, y: 55 }, dur: 7, fade: 1, steps: [{ wait: 600 }, N("film_n05", "Oops…"), { wait: 500 }, F("film_f05", "My tower… it's all gone."), { wait: 500 }] },
  { frame: "film_tower_06_storm", from: { s: 1.0, x: 50, y: 50 }, to: { s: 1.3, x: 50, y: 50 }, dur: 9, fade: 0.6, steps: [{ fx: { storm: 1, shake: true } }, F("film_f06a", "Grrr! I feel so angry. It's like a big storm inside me!"), { wait: 300 }, F("film_f06b", "What should I do? Help me choose!")] },
];

const SHOUT: Shot[] = [
  { frame: "film_tower_a1_shout", from: { s: 1.05, x: 40, y: 50 }, to: { s: 1.22, x: 38, y: 48 }, dur: 6, fade: 0.3, steps: [{ fx: { storm: 1, shake: true } }, F("film_fa1", "Nori! You knocked it over! Go away!"), { wait: 400 }, N("film_na1", "But… it was an accident…"), { wait: 500 }] },
  { frame: "film_tower_a2_alone", from: { s: 1.0, x: 50, y: 50 }, to: { s: 1.18, x: 45, y: 58 }, dur: 10, fade: 1.6, steps: [{ fx: { storm: 0.35 } }, { wait: 800 }, F("film_fa2a", "Nori ran away. My tower is still broken, and now I'm all alone."), { wait: 600 }, F("film_fa2b", "Shouting didn't help. Let's go back and try again.")] },
];

const BREATHE: Shot[] = [
  {
    frame: "film_tower_b1_breathe",
    from: { s: 1.25, x: 35, y: 50 },
    to: { s: 1.25, x: 35, y: 50 },
    dur: 1,
    fade: 1.2,
    steps: [
      { fx: { storm: 0.5 } },
      F("film_fb1a", "Wait. Let me take a big, slow breath. In…"),
      { cam: { s: 1.08, x: 40, y: 48 }, dur: 3.2 },
      { wait: 2600 },
      { fx: { storm: 0 } },
      F("film_fb1b", "…and out. My storm is getting smaller."),
      { cam: { s: 1.2, x: 38, y: 50 }, dur: 3 },
      { wait: 1200 },
    ],
  },
  { frame: "film_tower_b2_talk", from: { s: 1.05, x: 50, y: 50 }, to: { s: 1.25, x: 52, y: 42 }, dur: 14, fade: 1, steps: [{ fx: { warm: 0.4 } }, F("film_fb2a", "Nori, I was really upset when my tower fell. But I know it was an accident."), { wait: 300 }, N("film_nb2a", "I'm sorry, Feelio."), { wait: 300 }, F("film_fb2b", "That's okay. Want to build a new one together?"), N("film_nb2b", "Yes!"), { wait: 300 }] },
  { frame: "film_tower_b3_together", from: { s: 1.18, x: 52, y: 45 }, to: { s: 1.02, x: 50, y: 50 }, dur: 5, fade: 0.8, steps: [{ sfx: "pop" }, F("film_fb3", "One block for you, one block for me!"), { wait: 800 }] },
  { frame: "film_tower_end_cheer", from: { s: 1.0, x: 50, y: 50 }, to: { s: 1.12, x: 50, y: 48 }, dur: 9, fade: 1.2, steps: [{ fx: { warm: 0.6, burst: true } }, { sfx: "unlock" }, { wait: 800 }, F("film_fend", "When I feel a storm inside, I breathe first. Then I can find a kind way."), { wait: 900 }] },
];

type Phase = "poster" | "playing" | "choice" | "rewind" | "end";
type ShotState = { frame: FilmFrameId; from: Cam; to: Cam; dur: number; fade: number; n: number };

export function FilmSpike() {
  const [phase, setPhase] = useState<Phase>("poster");
  const [shot, setShot] = useState<ShotState>({ ...ACT1[0], fade: 0, n: 0 });
  const [fx, setFx] = useState<Required<Omit<Fx, "shake">>>({ storm: 0, warm: 0, burst: false });
  const [shake, setShake] = useState(0);
  const [sub, setSub] = useState<{ who: Who; text: string } | null>(null);
  const [rewinding, setRewinding] = useState(false);
  const run = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(
    () => () => {
      run.current++;
      audio.current?.pause();
    },
    [],
  );

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const speak = (key: string) =>
    new Promise<void>((resolve) => {
      const a = new Audio(`/audio/en/${key}.mp3`);
      audio.current = a;
      a.onended = () => resolve();
      a.onerror = () => setTimeout(resolve, 2500);
      void a.play().catch(() => setTimeout(resolve, 2500));
    });

  async function playShots(id: number, shots: Shot[]) {
    for (const s of shots) {
      if (run.current !== id) return false;
      setShot((prev) => ({ frame: s.frame, from: s.from, to: s.to, dur: s.dur, fade: s.fade ?? 0.8, n: prev.n + 1 }));
      for (const st of s.steps) {
        if (run.current !== id) return false;
        if ("say" in st) {
          setSub({ who: st.who, text: st.text });
          await speak(st.say);
          await wait(200);
        } else if ("wait" in st) await wait(st.wait);
        else if ("cam" in st) setShot((prev) => ({ ...prev, to: st.cam, dur: st.dur }));
        else if ("sfx" in st) sfx(st.sfx);
        else {
          const { shake: sh, ...rest } = st.fx;
          if (sh) setShake((k) => k + 1);
          setFx((f) => ({ ...f, ...rest }));
        }
      }
    }
    setSub(null);
    return run.current === id;
  }

  const start = async () => {
    const id = ++run.current;
    setFx({ storm: 0, warm: 0, burst: false });
    setSub(null);
    setPhase("playing");
    if (await playShots(id, ACT1)) setPhase("choice");
  };
  const choose = async (branch: "shout" | "breathe") => {
    const id = ++run.current;
    setPhase("playing");
    if (branch === "shout") {
      if (await playShots(id, SHOUT)) setPhase("rewind");
    } else if (await playShots(id, BREATHE)) setPhase("end");
  };
  const rewind = async () => {
    const id = ++run.current;
    setPhase("playing");
    setSub(null);
    setRewinding(true);
    sfx("whoosh");
    // The tape runs back: the shots flash by in reverse.
    for (const frame of ["film_tower_a1_shout", "film_tower_06_storm"] as const) {
      setShot((prev) => ({ frame, from: { s: 1.2, x: 50, y: 50 }, to: { s: 1.0, x: 50, y: 50 }, dur: 0.5, fade: 0.1, n: prev.n + 1 }));
      await wait(450);
    }
    setRewinding(false);
    setFx((f) => ({ ...f, storm: 1 }));
    setShot((prev) => ({ ...prev, from: { s: 1.25, x: 50, y: 50 }, to: { s: 1.3, x: 50, y: 50 }, dur: 2, n: prev.n + 1 }));
    if (run.current === id) {
      setSub({ who: "F", text: "What should I do? Help me choose!" });
      setPhase("choice");
    }
  };

  return (
    <main className={styles.screen} data-phase={phase}>
      <div className={styles.frame} data-rewinding={rewinding || undefined}>
        <motion.div key={shake} className={styles.shaker} animate={shake ? { x: [0, -12, 10, -7, 5, -2, 0], y: [0, 4, -3, 2, 0, 0, 0] } : {}} transition={{ duration: 0.5 }}>
          <AnimatePresence initial={false}>
            <motion.div key={shot.n} className={styles.layer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: shot.fade }}>
              <motion.div className={styles.camera} initial={camTransform(shot.from)} animate={camTransform(shot.to)} transition={{ duration: shot.dur, ease: [0.37, 0, 0.63, 1] }}>
                <AssetImage id={shot.frame as AssetId} alt="" sizes="100vw" className={styles.bg} priority />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div className={styles.storm} animate={{ opacity: fx.storm * 0.5 }} transition={{ duration: 1.5 }} />
        <motion.div className={styles.warm} animate={{ opacity: fx.warm }} transition={{ duration: 2 }} />
        <div className={styles.vignette} />
        <AnimatePresence>
          {fx.burst && phase === "playing" ? (
            <motion.div className={styles.burst} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.9, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <AssetImage id="ui_celebrate_burst" alt="" sizes="30vw" className={styles.img} />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <motion.div className={styles.bars} animate={{ opacity: phase === "choice" || phase === "rewind" ? 1 : 0 }} transition={{ duration: 0.6 }} />

        <AnimatePresence mode="wait">
          {sub && phase !== "poster" ? (
            <motion.p key={sub.text} className={styles.sub} data-who={sub.who} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {sub.text}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {phase === "poster" ? (
          <div className={styles.poster}>
            <p className={styles.title}>The Tower</p>
            <button type="button" className={styles.play} onClick={start} aria-label="Play">
              <Play size={56} strokeWidth={3} />
            </button>
            <p className={styles.note}>Sample film (throwaway, development only). Sound on.</p>
          </div>
        ) : null}

        {phase === "choice" ? (
          <div className={styles.choices}>
            <motion.button type="button" className={styles.card} onClick={() => choose("shout")} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <AssetImage id="mascot_feel_angry" alt="" sizes="20vw" className={styles.cardImg} />
              <span>Shout at Nori</span>
            </motion.button>
            <motion.button type="button" className={styles.card} onClick={() => choose("breathe")} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <AssetImage id="mascot_breathe_in" alt="" sizes="20vw" className={styles.cardImg} />
              <span>Take a big breath</span>
            </motion.button>
          </div>
        ) : null}

        {phase === "rewind" ? (
          <div className={styles.choices}>
            <motion.button type="button" className={styles.card} data-wide onClick={rewind} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Rewind size={48} strokeWidth={3} />
              <span>Rewind and try again</span>
            </motion.button>
          </div>
        ) : null}

        {phase === "end" ? (
          <motion.div className={styles.poster} data-end initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <p className={styles.title}>The End</p>
            <button type="button" className={styles.play} onClick={start} aria-label="Watch again">
              <RotateCcw size={48} strokeWidth={3} />
            </button>
          </motion.div>
        ) : null}
      </div>
    </main>
  );
}
