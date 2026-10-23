// The Tower (Home level 3, docs/SEL_ADVENTURES.md): Feelio builds a block tower, little Nori knocks it
// over by accident, and the child helps Feelio with the anger that follows. The child names the feeling,
// sees that a big storm leaves only stormy choices, calms it with Cloud Breath, and then finds the kind
// choices that appear. Every choice gets a gentle outcome and a way back; there is no wrong answer to
// fail. Pure: the screen renders the state, and the tests drive it. Nothing here is stored or reported.

export type Beat =
  | "build" // tap the blocks to build the tower
  | "crash" // Nori bumps it; it falls
  | "feel" // which feeling is Feelio having?
  | "feelSaid" // Feelio answers the child's pick
  | "choose" // stormy: only stormy choices, plus the calm cloud
  | "stomp" // outcome of a stormy choice
  | "shout"
  | "breathe" // Cloud Breath: in, out, in, out
  | "chooseCalm" // calm: all four choices
  | "tell" // outcome of a kind choice
  | "together"
  | "rebuild" // build again with Nori
  | "end"; // what we learned, the journal, try another way or finish

export const FACES = ["angry", "sad", "worried", "happy"] as const;
export type Face = (typeof FACES)[number];
export const CHOICES = ["stomp", "shout", "tell", "together"] as const;
export type Choice = (typeof CHOICES)[number];
export const STORMY: readonly Choice[] = ["stomp", "shout"];
export const KIND: readonly Choice[] = ["tell", "together"];

/** Taps to build the tower (and to rebuild it). */
export const TOWER_HEIGHT = 4;
/** Breaths in Cloud Breath: in, out, in, out. */
export const BREATHS = 4;

export type TowerState = {
  beat: Beat;
  /** Blocks on the tower now (0 to TOWER_HEIGHT). */
  height: number;
  face: Face | null;
  /** Breath steps done in this calm-down (0 to BREATHS). */
  breaths: number;
  /** Endings found this visit, in the order found (Feelio's Journal; session only). */
  found: Choice[];
};

export type TowerEvent =
  | { type: "block" } // a tap on the blocks
  | { type: "next" } // the current line finished (or the child tapped on)
  | { type: "face"; face: Face }
  | { type: "pick"; choice: Choice }
  | { type: "calm" } // the cloud
  | { type: "breath" } // one breath step finished
  | { type: "rewind" }
  | { type: "again" }; // try another way, from the end

export const START: TowerState = { beat: "build", height: 0, face: null, breaths: 0, found: [] };

/** The choices the child can see on this beat. A storm leaves only stormy ideas. */
export function choicesOn(s: TowerState): readonly Choice[] {
  if (s.beat === "choose") return STORMY;
  if (s.beat === "chooseCalm") return CHOICES;
  return [];
}

function found(s: TowerState, c: Choice): Choice[] {
  return s.found.includes(c) ? s.found : [...s.found, c];
}

export function step(s: TowerState, e: TowerEvent): TowerState {
  switch (s.beat) {
    case "build":
      if (e.type !== "block") return s;
      return s.height + 1 >= TOWER_HEIGHT ? { ...s, height: TOWER_HEIGHT, beat: "crash" } : { ...s, height: s.height + 1 };
    case "crash":
      return e.type === "next" ? { ...s, height: 0, beat: "feel" } : s;
    case "feel":
      return e.type === "face" ? { ...s, face: e.face, beat: "feelSaid" } : s;
    case "feelSaid":
      return e.type === "next" ? { ...s, beat: "choose" } : s;
    case "choose":
      if (e.type === "calm") return { ...s, beat: "breathe", breaths: 0 };
      if (e.type === "pick" && STORMY.includes(e.choice)) return { ...s, beat: e.choice, found: found(s, e.choice) };
      return s;
    case "chooseCalm":
      if (e.type === "pick") return { ...s, beat: e.choice, found: found(s, e.choice) };
      return s;
    case "stomp":
    case "shout":
      // A stormy choice: see what happened, then go back and try again (the storm is still there).
      return e.type === "rewind" ? { ...s, beat: "choose" } : s;
    case "breathe":
      if (e.type !== "breath") return s;
      return s.breaths + 1 >= BREATHS ? { ...s, breaths: BREATHS, beat: "chooseCalm" } : { ...s, breaths: s.breaths + 1 };
    case "tell":
    case "together":
      return e.type === "next" ? { ...s, beat: "rebuild", height: 0 } : s;
    case "rebuild":
      if (e.type !== "block") return s;
      return s.height + 1 >= TOWER_HEIGHT ? { ...s, height: TOWER_HEIGHT, beat: "end" } : { ...s, height: s.height + 1 };
    case "end":
      // Try another way: back to the moment after the crash, storm and all. The journal stays.
      return e.type === "again" ? { ...s, beat: "choose", height: 0, face: null, breaths: 0 } : s;
  }
}

/** Feelio's mood on each beat (stormy until it has calmed down). */
export function mood(s: TowerState): "happy" | "excited" | "angry" | "sad" | "calm" | "proud" {
  switch (s.beat) {
    case "build":
      return s.height ? "excited" : "happy";
    case "crash":
    case "feel":
    case "feelSaid":
    case "choose":
    case "stomp":
      return "angry";
    case "shout":
      return "sad";
    case "breathe":
    case "chooseCalm":
      return "calm";
    case "tell":
    case "together":
    case "rebuild":
      return "happy";
    case "end":
      return "proud";
  }
}

/** The message key (under child.scenarios.tower) for what Feelio says on this beat. */
export function lineOf(s: TowerState): string {
  switch (s.beat) {
    case "build":
      return s.height === 0 ? "build" : s.height === TOWER_HEIGHT - 1 ? "buildLast" : "buildMore";
    case "feelSaid":
      return s.face === "angry" ? "feelAngry" : s.face === "happy" ? "feelHappy" : "feelMixed";
    case "breathe":
      return s.breaths % 2 === 0 ? "breatheIn" : "breatheOut";
    case "rebuild":
      return s.height === 0 ? "rebuild" : "rebuildMore";
    default:
      return s.beat;
  }
}

/**
 * How long a line stays before the story moves on by itself (a Next button skips ahead). Unit-tested
 * to outlast every recorded line, so Feelio is never cut off.
 */
export function lineMs(text: string): number {
  return Math.max(3000, text.split(/\s+/).length * 450 + 1800);
}
/** One breath in or out. */
export const BREATH_MS = 4500;

/** Whether this beat moves on by itself when its line is done (the others wait for a tap). */
export function autoNext(s: TowerState): "next" | "breath" | null {
  if (s.beat === "crash" || s.beat === "feelSaid" || s.beat === "tell" || s.beat === "together") return "next";
  if (s.beat === "breathe") return "breath";
  return null;
}
