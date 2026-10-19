import type { AssetId } from "@/design/asset-ids";
import type { Activity } from "@/safety/voice-agent/tools";

// The voice room's calm activities (D-076), pure: their steps and their lifecycle, shared by the screen
// and its tests. The app owns the rhythm: every step has a fixed length (or waits for the child), the
// animation follows the step, and Feelio's pre-recorded line for the step plays as it starts, so voice
// and picture can't drift apart. No step ever asks the child to hold their breath.

type MascotPoseId = Extract<AssetId, `mascot_${string}`>;

export type StepKind = "intro" | "in" | "out" | "find" | "move" | "done";

export type Step = {
  kind: StepKind;
  /** How long the step lasts; null waits for the child (finding things, the end). */
  ms: number | null;
  /** Message key under child.talk.act, and its pre-recorded voice line (public/audio/<locale>/<line>.mp3). */
  say: string;
  line: string;
  /** Feelio's pose, in order of preference (the first delivered one is used, design/asset-slots). */
  pose: readonly MascotPoseId[];
  /** A move's animation (stretching), or what to find and how many (grounding). */
  move?: "up" | "sway" | "shake" | "hug";
  token?: AssetId;
  count?: number;
};

const BREATH_IN_MS = 4000;
/** Breathing out a little longer than in calms the body; there is never a hold. */
const BREATH_OUT_MS = 5000;
const DONE: Step = { kind: "done", ms: null, say: "done", line: "act_done", pose: ["mascot_happy"] };

const breath = (): Step[] => [
  { kind: "in", ms: BREATH_IN_MS, say: "breathing.in", line: "act_breathe_in", pose: ["mascot_breathe_in", "mascot_idle"] },
  { kind: "out", ms: BREATH_OUT_MS, say: "breathing.out", line: "act_breathe_out", pose: ["mascot_breathe_out", "mascot_idle"] },
];

export const ACTIVITY_STEPS: Record<Activity, readonly Step[]> = {
  breathing: [{ kind: "intro", ms: 4500, say: "breathing.intro", line: "act_breathe_intro", pose: ["mascot_idle"] }, ...breath(), ...breath(), ...breath(), DONE],
  grounding: [
    // the intro line is about 4.9 s (2026-10-19); the step leaves room for it to finish
    { kind: "intro", ms: 5500, say: "grounding.intro", line: "act_ground_intro", pose: ["mascot_idle"] },
    { kind: "find", ms: null, say: "grounding.look", line: "act_ground_look", pose: ["mascot_look", "mascot_pointing"], token: "companion_star", count: 3 },
    { kind: "find", ms: null, say: "grounding.listen", line: "act_ground_listen", pose: ["mascot_listening"], token: "companion_heart", count: 2 },
    { kind: "find", ms: null, say: "grounding.feel", line: "act_ground_feel", pose: ["mascot_hug", "mascot_idle"], token: "companion_cloud", count: 1 },
    DONE,
  ],
  stretching: [
    { kind: "intro", ms: 5000, say: "stretching.intro", line: "act_stretch_intro", pose: ["mascot_idle"] },
    { kind: "move", ms: 8000, say: "stretching.up", line: "act_stretch_up", pose: ["mascot_stretch_up", "mascot_excited"], move: "up" },
    { kind: "move", ms: 8000, say: "stretching.sway", line: "act_stretch_sway", pose: ["mascot_stretch_side", "mascot_waving"], move: "sway" },
    { kind: "move", ms: 6000, say: "stretching.shake", line: "act_stretch_shake", pose: ["mascot_shake", "mascot_happy"], move: "shake" },
    { kind: "move", ms: 6000, say: "stretching.hug", line: "act_stretch_hug", pose: ["mascot_hug", "mascot_happy"], move: "hug" },
    DONE,
  ],
};

export type Run = {
  activity: Activity;
  step: number;
  status: "running" | "paused" | "done";
  /** When a timed step ends (running only). */
  endsAt: number | null;
  /** Time left in a timed step (paused only). */
  left: number | null;
  /** Things found on a finding step. */
  found: number;
};

const at = (activity: Activity, step: number, now: number): Run => {
  const s = ACTIVITY_STEPS[activity][step];
  return { activity, step, status: s.kind === "done" ? "done" : "running", endsAt: s.ms === null ? null : now + s.ms, left: null, found: 0 };
};

export const startRun = (activity: Activity, now: number): Run => at(activity, 0, now);

/** The next step (the end stays the end). */
export function advance(r: Run, now: number): Run {
  if (r.status === "done") return r;
  return at(r.activity, Math.min(r.step + 1, ACTIVITY_STEPS[r.activity].length - 1), now);
}

/** A timed step ends by the clock; nothing moves while paused or waiting for the child. */
export function tick(r: Run, now: number): Run {
  return r.status === "running" && r.endsAt !== null && now >= r.endsAt ? advance(r, now) : r;
}

export function pause(r: Run, now: number): Run {
  if (r.status !== "running") return r;
  return { ...r, status: "paused", endsAt: null, left: r.endsAt === null ? null : Math.max(0, r.endsAt - now) };
}

export function resume(r: Run, now: number): Run {
  if (r.status !== "paused") return r;
  return { ...r, status: "running", endsAt: r.left === null ? null : now + r.left, left: null };
}

/** The child found one more thing; when all are found, the next step. */
export function find(r: Run, now: number): Run {
  const s = ACTIVITY_STEPS[r.activity][r.step];
  if (r.status !== "running" || s.kind !== "find") return r;
  const found = r.found + 1;
  return found >= (s.count ?? 1) ? advance(r, now) : { ...r, found };
}

/** "Next": the child moves on whenever they like (a paused run resumes on the next step). */
export const skip = (r: Run, now: number): Run => advance(r, now);

export const restart = (r: Run, now: number): Run => startRun(r.activity, now);

/** How far along the run is, for the progress pips: breaths for breathing, steps for the others. */
export function progressOf(r: Run): { done: number; total: number } {
  const steps = ACTIVITY_STEPS[r.activity];
  const counts = (s: Step) => (r.activity === "breathing" ? s.kind === "in" : s.kind === "find" || s.kind === "move");
  const total = steps.filter(counts).length;
  if (r.status === "done") return { done: total, total };
  // a breath counts once breathed out; a step counts once left behind
  const done = steps.slice(0, r.step).filter(counts).length - (r.activity === "breathing" && steps[r.step].kind === "out" ? 1 : 0);
  return { done: Math.max(0, done), total };
}
