import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import type { GameView } from "@/safety/prompts";
import type { Activity } from "@/safety/voice-agent/tools";
import { ACTIVITY_STEPS, progressOf, type Run } from "./activities";

// One conversation, game included (D-077): what Feelio knows about the game the child is playing during
// a live talk. The screen reports the game's state (ids and numbers from closed lists, never words);
// the server keeps it on the open voice session and the proxy turns it into context for every turn.
// It lives only while the talk is open: ending the talk clears it. Pure, shared by server and tests.

export const GAME_STATUS = ["running", "paused", "done", "stopped"] as const;
export type GameStatus = (typeof GAME_STATUS)[number];

/** What the screen reports: which game, which step, how it is going, how many things were found. */
export type GameReport = { activity: Activity; step: number; status: GameStatus; found: number };
export type GameMemory = { now: GameReport | null; played: { activity: Activity; outcome: "done" | "stopped" }[] };

export const EMPTY_GAME: GameMemory = { now: null, played: [] };
/** Earlier games of the same talk that Feelio remembers (a talk lasts minutes, so a few at most). */
const PLAYED_MAX = 6;

const ended = (s: GameStatus) => s === "done" || s === "stopped";

/** A report the screen could really have sent: a real step of that game, a possible number found. */
export function validReport(r: GameReport): boolean {
  const steps = ACTIVITY_STEPS[r.activity];
  const s = steps?.[r.step];
  if (!s || !Number.isInteger(r.step) || !Number.isInteger(r.found) || r.found < 0) return false;
  if (r.found > (s.count ?? 0)) return false;
  // "done" only on the last step; a timed or waiting step is never "done"
  return r.status === "done" ? s.kind === "done" : r.status === "stopped" || s.kind !== "done";
}

/** The talk's game memory after one report. A game that ends is remembered once. */
export function remember(m: GameMemory, r: GameReport): GameMemory {
  if (!validReport(r)) return m;
  if (ended(r.status)) {
    // already over (the cheer, then "Back to Feelio"): nothing new happened
    if (!m.now || ended(m.now.status)) return m;
    return { now: r, played: [...m.played, { activity: r.activity, outcome: r.status as "done" | "stopped" }].slice(-PLAYED_MAX) };
  }
  return { ...m, now: r };
}

/** The screen's run as a report. */
export const reportOf = (run: Run, status: GameStatus = run.status): GameReport => ({ activity: run.activity, step: run.step, status, found: run.found });

const LINES = { en: en.child.talk.act, ar: ar.child.talk.act } as const;

/** Reviewed app text by key under child.talk.act (never the child's words). */
function actText(locale: "en" | "ar", key: string): string {
  const v = key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), LINES[locale]);
  return typeof v === "string" ? v : "";
}

/** What Feelio is told about the game (prompt context), from the memory and our own reviewed text. */
export function gameView(m: GameMemory | null | undefined, locale: "en" | "ar"): GameView | null {
  if (!m || (!m.now && !m.played.length)) return null;
  const now = m.now;
  // the game happening now (or just over) is told on its own; the others are earlier in the talk
  const earlier = now && ended(now.status) ? m.played.slice(0, -1) : m.played;
  if (!now) return { now: null, earlier };
  const steps = ACTIVITY_STEPS[now.activity];
  const step = steps[now.step];
  const run: Run = { activity: now.activity, step: now.step, status: now.status === "done" ? "done" : "running", endsAt: null, left: null, found: now.found };
  return {
    now: {
      activity: now.activity,
      status: now.status,
      step: actText(locale, step.say),
      progress: progressOf(run),
      ...(step.kind === "find" ? { found: now.found, of: step.count ?? 1 } : {}),
    },
    earlier,
  };
}

/** Every line Feelio's recorded voice says in the games (both languages): what an echo would sound like. */
export function recordedLines(): string[] {
  const keys = new Set(Object.values(ACTIVITY_STEPS).flatMap((steps) => steps.map((s) => s.say)));
  return (["en", "ar"] as const).flatMap((l) => [...keys].map((k) => actText(l, k)).filter(Boolean));
}
