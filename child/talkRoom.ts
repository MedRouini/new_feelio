import type { VoiceState } from "@/safety/voice-agent/useVoice";
import type { Activity, Offerable, ToolCall } from "@/safety/voice-agent/tools";
import { ACTIVITIES } from "@/safety/voice-agent/tools";
import { pause, resume, startRun, type Run } from "./activities";

// The voice room's rules (D-076), pure: what Feelio's screen tools may change, and which one phase the
// room is in. Help (the router's crisis tool) always wins. An activity starts on the child's yes (or a
// tap). During a live talk the game and the talk are one conversation (D-077): Feelio can stop the game
// when the child asks, the game holds while Feelio speaks, and any other tool still arriving is stale and
// ignored (except help). The same offer twice changes nothing. What a child can open is the server's check; the screen
// checks again with what the page was given.

export type Feeling = Extract<ToolCall, { name: "show_feeling_card" }>["args"]["feeling"];
export type Offer = { kind: "activity"; activity: Offerable } | { kind: "place"; place: string };

export type Room = {
  offer: Offer | null;
  feeling: Feeling | null;
  help: string[] | null;
  run: Run | null;
  /** The activity the child last finished, for the next talk (closed list). */
  after: Activity | null;
  /** The game is waiting while Feelio speaks (not the child's own pause). */
  held: boolean;
};

export const EMPTY_ROOM: Room = { offer: null, feeling: null, help: null, run: null, after: null, held: false };

const sameOffer = (a: Offer | null, b: Offer) =>
  !!a && a.kind === b.kind && (a.kind === "activity" ? a.activity === (b as typeof a).activity : a.place === (b as typeof a).place);

export function withTool(room: Room, call: ToolCall, can: { places: readonly string[]; stories: boolean }): Room {
  if (call.name === "show_safety_resources") return { ...room, help: call.args.kinds, offer: null };
  // The child asked Feelio to stop the game (D-077).
  if (call.name === "stop_activity") return room.run && room.run.status !== "done" ? endRun(room) : room;
  if (room.help || room.run) return room;
  if (call.name === "show_feeling_card") return room.feeling === call.args.feeling ? room : { ...room, feeling: call.args.feeling };
  let offer: Offer | null = null;
  if (call.name === "offer_activity" && (call.args.activity !== "story" || can.stories)) offer = { kind: "activity", activity: call.args.activity };
  if (call.name === "suggest_place" && can.places.includes(call.args.place)) offer = { kind: "place", place: call.args.place };
  if (!offer || sameOffer(room.offer, offer)) return room;
  return { ...room, offer };
}

const isActivity = (a: Offerable): a is Activity => (ACTIVITIES as readonly string[]).includes(a);

/** The child tapped the offer: a calm activity starts here; a story or a place is a page to go to. */
export function acceptOffer(room: Room, now: number): Room {
  const o = room.offer;
  if (!o || o.kind !== "activity" || !isActivity(o.activity) || room.help) return room;
  return { ...room, offer: null, feeling: null, run: startRun(o.activity, now), held: false };
}

/**
 * A yes in the talk starts the game (owner, 2026-10-16): Feelio only calls offer_activity after the
 * child said yes, so during a live talk a calm activity starts by itself, once Feelio has finished its
 * sentence. Stories and places stay doors to tap (they leave the page); help always wins.
 */
export function startsByVoice(room: Room, voice: VoiceState): boolean {
  const o = room.offer;
  if (!o || o.kind !== "activity" || !isActivity(o.activity) || room.help || room.run) return false;
  return voice === "listening" || voice === "thinking";
}

export const dismissOffer = (room: Room): Room => (room.offer ? { ...room, offer: null } : room);
export const closeHelp = (room: Room): Room => (room.help ? { ...room, help: null } : room);

/** Back to the talk; the activity is remembered for the next talk only when the child finished it. */
export function endRun(room: Room): Room {
  if (!room.run) return room;
  return { ...room, run: null, held: false, after: room.run.status === "done" ? room.run.activity : room.after };
}

/**
 * Feelio is speaking during a game (D-077): the game waits (its clock and recorded line stop), so two
 * voices never talk at once. Only a running game is held; a game the child paused stays theirs.
 */
export function hold(room: Room, now: number): Room {
  if (!room.run || room.run.status !== "running" || room.held) return room;
  return { ...room, run: pause(room.run, now), held: true };
}

/** Feelio finished speaking: the game goes on from where it waited. */
export function release(room: Room, now: number): Room {
  if (!room.held) return room;
  return { ...room, held: false, run: room.run ? resume(room.run, now) : null };
}

export type Phase = VoiceState | "problem" | "activity";

/** One phase at a time, so the room never shows two contradicting states. */
export function roomPhase(voice: VoiceState, problem: string | null, room: Room): Phase {
  if (room.run) return "activity";
  if (problem) return "problem";
  return voice;
}
