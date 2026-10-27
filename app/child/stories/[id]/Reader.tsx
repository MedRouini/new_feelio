"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, Home, Star } from "lucide-react";
import { ActionObject } from "@/child/ui/ActionObject";
import { ChoiceDisc } from "@/child/ui/ChoiceDisc";
import { Pressable } from "@/child/ui/Pressable";
import { Mascot, type MascotPose } from "@/child/ui/Mascot";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import { AssetImage } from "@/design/components/AssetImage";
import { LOADING_BEAT, pick } from "@/design/asset-slots";
import type { Book } from "@/child/stories";
import { Library } from "../Shelf";
import { STORY_ART } from "../art";
import styles from "./reader.module.css";

type PicState = "waiting" | "drawing" | "ready" | "fallback" | "unavailable";
/** 0 = cover, 1..4 = the pages, 5 = the end. */
const LAST = 5;
const TURN_MS = 760;

/**
 * The storybook (D-070): a real book. On wide screens a two-page spread (the picture on the start page,
 * the words and Feelio on the end page) whose leaf turns around the spine in 3D; on phones one page at a
 * time. Pictures are painted while the child reads (one short request each) and fade in when ready.
 * Swipe, the big arrows, or the arrow keys turn the pages; reduced motion cross-fades instead.
 */
export function Reader({ book, narration }: { book: Book; narration: boolean }) {
  const t = useTranslations("child.stories");
  const tOnb = useTranslations("child.onb");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const rtl = locale === "ar";
  const calm = useCalm();
  const [at, setAt] = useState(0);
  const [turn, setTurn] = useState<null | { from: number; to: number }>(null);
  const [pics, setPics] = useState<PicState[]>(() => [book.cover, ...book.pages.map((p) => p.picture)]);
  const [nonce] = useState(() => Date.now());
  const [answer, setAnswer] = useState<number | null>(null);
  const [wide, setWide] = useState(true);
  const drag = useRef<number | null>(null);

  useEffect(() => {
    const mq = matchMedia("(orientation: landscape) and (min-width: 700px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Paint the pictures that aren't ready: the cover first (the style reference), then the pages.
  useEffect(() => {
    let stop = false;
    const draw = async (n: number): Promise<PicState> => {
      for (let tries = 0; tries < 30 && !stop; tries++) {
        setPics((p) => p.map((s, i) => (i === n && s === "waiting" ? "drawing" : s)));
        const res = await fetch(`/api/child/stories/${book.id}/picture?n=${n}`, { method: "POST" }).catch(() => null);
        if (!res) return "unavailable";
        if (res.ok) return ((await res.json()) as { state: PicState }).state;
        if (res.status === 503) return "unavailable";
        if (res.status === 409) {
          await new Promise((r) => setTimeout(r, 2500)); // being drawn, or waiting for the cover
          continue;
        }
        return "unavailable";
      }
      return "unavailable";
    };
    const set = (n: number, s: PicState) => setPics((p) => p.map((x, i) => (i === n ? s : x)));
    (async () => {
      const initial = [book.cover, ...book.pages.map((p) => p.picture)];
      if (initial[0] !== "ready" && initial[0] !== "fallback") {
        const s = await draw(0);
        if (stop) return;
        set(0, s);
        if (s === "unavailable") {
          for (let n = 1; n < initial.length; n++) if (initial[n] !== "ready" && initial[n] !== "fallback") set(n, "unavailable");
          return;
        }
      }
      // One page after another, in reading order (the picture service limits parallel requests).
      for (let n = 1; n < initial.length && !stop; n++) {
        if (initial[n] === "ready" || initial[n] === "fallback") continue;
        const r = await draw(n);
        if (!stop) set(n, r);
      }
    })();
    return () => {
      stop = true;
    };
  }, [book]);

  const go = useCallback(
    (d: 1 | -1) => {
      if (turn) return;
      const to = at + d;
      if (to < 0 || to > LAST) return;
      play("whoosh");
      if (calm) {
        setAt(to);
        return;
      }
      setTurn({ from: at, to });
      setTimeout(() => {
        setAt(to);
        setTurn(null);
      }, TURN_MS);
    },
    [at, turn, calm],
  );

  const jump = (to: number) => {
    if (turn || to === at) return;
    play("step");
    setAt(to);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      else if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [go, rtl]);

  const onDown = (e: PointerEvent) => (drag.current = e.clientX);
  const onUp = (e: PointerEvent) => {
    const x = drag.current;
    drag.current = null;
    if (x === null) return;
    const dx = e.clientX - x;
    if (Math.abs(dx) < 50) return;
    go((dx < 0) !== rtl ? 1 : -1);
  };

  // ---------- the faces of each spread: start = picture side, end = words side ----------
  const picture = (n: number, mood: string) => <Picture storyId={book.id} n={n} state={pics[n]} nonce={nonce} mood={mood} />;
  const faces = (i: number): { start: ReactNode; end: ReactNode } => {
    if (i === 0)
      return {
        start: picture(0, "happy"),
        end: (
          <div className={styles.coverText}>
            <h1 className={styles.title}>{book.title}</h1>
            <Pressable tone="primary" label={t("openBook")} icon={<BookOpen size={30} aria-hidden />} onPress={() => go(1)} className={styles.open} testId="open-book" />
          </div>
        ),
      };
    if (i === LAST)
      return {
        start: (
          <div className={styles.endArt}>
            <Mascot pose={pick(STORY_ART.reader)} label={tOnb("aiSign")} sizes="30vmin" className={styles.endMascot} />
          </div>
        ),
        end: (
          <div className={styles.endText}>
            <p className={styles.theEnd}>{t("theEnd")}</p>
            <p className={styles.question}>{book.question.text}</p>
            <ul className={styles.answers}>
              {book.question.answers.map((a, k) => (
                <li key={k}>
                  <button type="button" className={styles.answer} aria-pressed={answer === k} onClick={() => (play("pick"), setAnswer(k))} data-testid={`answer-${k}`}>
                    <ChoiceDisc word={a} selected={answer === k} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.endActions}>
              <ActionObject art="ui_btn_make_story" label={t("another")} href="/stories/make" sizes="14vmin" className={styles.another} testId="make-another" />
              <Pressable label={t("home")} href="/stories" icon={<Home size={26} aria-hidden />} testId="end-home" />
            </div>
          </div>
        ),
      };
    const page = book.pages[i - 1];
    return {
      start: picture(i, page.feelio),
      end: (
        <div className={styles.pageText}>
          <p className={styles.words} data-testid={`page-${i}`}>
            {page.text}
          </p>
          <div className={styles.pageFoot}>
            <Mascot pose={moodPose(page.feelio)} label={tOnb("aiSign")} sizes="96px" className={styles.narrator} />
            {narration ? <ReadToMe storyId={book.id} page={i} /> : null}
          </div>
        </div>
      ),
    };
  };

  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const shown = turn ? turn.to : at;

  return (
    <div className={styles.room}>
      <Library />
      <Pressable shape="round" href="/stories" label={t("home")} icon={<Home size={30} aria-hidden />} className={styles.back} testId="book-home" />

      <nav className={styles.bookmarks} aria-label={t("pageOf", { n: Math.min(Math.max(shown, 1), 4), total: 4 })}>
        {Array.from({ length: LAST + 1 }, (_, n) => (
          <button key={n} type="button" className={styles.tab} aria-current={shown === n ? "page" : undefined} aria-label={n === 0 ? t("openBook") : n === LAST ? t("theEnd") : t("bookmark", { n })} onClick={() => jump(n)} data-testid={`bookmark-${n}`}>
            {n === 0 ? <BookOpen size={22} aria-hidden /> : n === LAST ? <Star size={22} aria-hidden /> : <span aria-hidden>{n}</span>}
          </button>
        ))}
      </nav>

      <div className={styles.bookWrap} onPointerDown={onDown} onPointerUp={onUp} data-turning={turn ? true : undefined} data-testid="book-wrap">
        <Pressable shape="round" label={t("prevPage")} icon={<Prev size={38} strokeWidth={3} aria-hidden />} onPress={() => go(-1)} disabled={at === 0} className={styles.corner} testId="prev-page" />

        {wide ? (
          <Spread faces={faces} at={at} turn={turn} rtl={rtl} calm={calm} />
        ) : (
          <div className={styles.single}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={shown}
                className={styles.singlePage}
                initial={calm ? { opacity: 0 } : { opacity: 0, rotateY: rtl ? -60 : 60, x: rtl ? -30 : 30 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={calm ? { opacity: 0 } : { opacity: 0, rotateY: rtl ? 70 : -70, x: rtl ? 30 : -30 }}
                transition={{ duration: calm ? 0.2 : 0.38, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: rtl ? "100% 50%" : "0% 50%" }}
              >
                <div className={styles.singlePic}>{faces(shown).start}</div>
                <div className={styles.singleText}>{faces(shown).end}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <Pressable shape="round" label={t("nextPage")} icon={<Next size={38} strokeWidth={3} aria-hidden />} onPress={() => go(1)} disabled={at === LAST} className={styles.corner} testId="next-page" />
      </div>
    </div>
  );
}

/** The two-page spread with a leaf that turns around the spine (3D), forwards or back. */
function Spread({ faces, at, turn, rtl, calm }: { faces: (i: number) => { start: ReactNode; end: ReactNode }; at: number; turn: null | { from: number; to: number }; rtl: boolean; calm: boolean }) {
  if (!turn || calm) {
    const f = faces(at);
    return (
      <div className={styles.spread}>
        <div className={styles.half} data-side="start">{f.start}</div>
        <div className={styles.half} data-side="end">{f.end}</div>
      </div>
    );
  }
  const from = faces(turn.from);
  const to = faces(turn.to);
  const forward = turn.to > turn.from;
  // Forward: the end page of `from` turns over and becomes the start page of `to`. Back: the reverse.
  const under = forward ? { start: from.start, end: to.end } : { start: to.start, end: from.end };
  const front = forward ? from.end : from.start;
  const back = forward ? to.start : to.end;
  // Physical side of the leaf: the end side is on the right in English and on the left in Arabic.
  const onRight = forward !== rtl;
  return (
    <div className={styles.spread}>
      <div className={styles.half} data-side="start">{under.start}</div>
      <div className={styles.half} data-side="end">{under.end}</div>
      <motion.div
        className={styles.leaf}
        style={{ [onRight ? "right" : "left"]: 0, transformOrigin: onRight ? "0% 50%" : "100% 50%" }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: onRight ? -180 : 180 }}
        transition={{ duration: TURN_MS / 1000, ease: [0.45, 0.05, 0.25, 1] }}
      >
        <div className={styles.leafFace}>{front}</div>
        <div className={styles.leafFace} data-back>
          {back}
        </div>
      </motion.div>
    </div>
  );
}

function moodPose(mood: string): MascotPose {
  const slot = STORY_ART.feelioMood[mood as keyof typeof STORY_ART.feelioMood] ?? STORY_ART.feelioMood.happy;
  return pick(slot);
}

/** One picture: the child's generated picture, or Feelio painting it, or a calm approved stand-in. */
function Picture({ storyId, n, state, nonce, mood }: { storyId: string; n: number; state: PicState; nonce: number; mood: string }) {
  const t = useTranslations("child.stories");
  const tOnb = useTranslations("child.onb");
  const [loaded, setLoaded] = useState(false);
  if (state === "ready")
    return (
      <div className={styles.pic}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the child's own picture, from private storage via our route */}
        <img src={`/api/child/stories/${storyId}/picture?n=${n}&v=${nonce}`} alt="" className={styles.picImg} data-loaded={loaded || undefined} onLoad={() => setLoaded(true)} />
      </div>
    );
  if (state === "waiting" || state === "drawing")
    return (
      <div className={styles.pic} data-painting>
        <Mascot pose={pick(["mascot_making", "mascot_happy"] as const)} label={tOnb("aiSign")} sizes="22vmin" className={styles.paintingMascot} />
        <span className={styles.beat} aria-hidden>
          {LOADING_BEAT.map((id) => (
            <AssetImage key={id} id={id} alt="" sizes="48px" className={styles.beatItem} />
          ))}
        </span>
        <span className={styles.painting}>{t("pictureComing")}</span>
      </div>
    );
  // No picture (blocked twice, or the picture service is off): Feelio in the page's mood, never a gap.
  return (
    <div className={styles.pic} data-stand-in>
      <Mascot pose={moodPose(mood)} label={tOnb("aiSign")} sizes="26vmin" className={styles.standIn} />
    </div>
  );
}

/** "Read it to me": Feelio reads this page (opt-in, made once per story, capped per day; D-070). */
function ReadToMe({ storyId, page }: { storyId: string; page: number }) {
  const t = useTranslations("child.stories");
  const [state, setState] = useState<"idle" | "loading" | "playing" | "refused">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => audio.current?.pause(), []);
  async function toggle() {
    if (state === "playing") {
      audio.current?.pause();
      setState("idle");
      return;
    }
    setState("loading");
    const a = new Audio(`/api/child/stories/${storyId}/narrate?page=${page}`);
    audio.current = a;
    a.onended = () => setState("idle");
    a.onerror = () => setState("refused");
    try {
      await a.play();
      setState("playing");
    } catch {
      setState("refused");
    }
  }
  if (state === "refused") return null;
  return (
    <ActionObject
      art="ui_btn_read_aloud"
      label={state === "playing" ? t("stop") : t("readAloud")}
      ready={state === "playing"}
      loading={state === "loading"}
      onPress={() => void toggle()}
      sizes="96px"
      className={styles.readAloud}
      testId="read-to-me"
    />
  );
}
