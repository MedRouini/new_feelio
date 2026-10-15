import { describe, expect, it } from "vitest";
import { ACTIVITY_STEPS, advance, find, pause, progressOf, restart, resume, skip, startRun, tick, type Run } from "@/child/activities";
import { EMPTY_ROOM, acceptOffer, closeHelp, dismissOffer, endRun, roomPhase, startsByVoice, withTool } from "@/child/talkRoom";
import { parseToolCall, type ToolCall } from "@/safety/voice-agent/tools";

// The voice room (D-076): the activity lifecycle (start, progress, pause, resume, skip, again, done)
// and the room's rules for what Feelio's tools may change (help always wins, nothing stale or doubled).

const T0 = 1_000_000;
const tool = (name: string, args: unknown) => parseToolCall(name, JSON.stringify(args), ["set_mascot_state", "show_feeling_card", "offer_activity", "suggest_place", "show_safety_resources"]) as ToolCall;
const can = { places: ["home"], stories: true };

describe("activity lifecycle", () => {
  it("every activity starts with an intro and ends on a done step that waits for the child", () => {
    for (const steps of Object.values(ACTIVITY_STEPS)) {
      expect(steps[0].kind).toBe("intro");
      expect(steps.at(-1)).toMatchObject({ kind: "done", ms: null });
    }
  });

  it("breathing: three slow rounds, breathing out longer than in, and never a hold", () => {
    const kinds = ACTIVITY_STEPS.breathing.map((s) => s.kind);
    expect(kinds.filter((k) => k === "in")).toHaveLength(3);
    expect(kinds.filter((k) => k === "out")).toHaveLength(3);
    expect(kinds).not.toContain("hold");
    const inn = ACTIVITY_STEPS.breathing.find((s) => s.kind === "in")!;
    const out = ACTIVITY_STEPS.breathing.find((s) => s.kind === "out")!;
    expect(inn.ms).toBeGreaterThanOrEqual(3000);
    expect(out.ms!).toBeGreaterThan(inn.ms!);
  });

  it("timed steps move on by the clock, and only by the clock", () => {
    let r = startRun("breathing", T0);
    expect(r).toMatchObject({ step: 0, status: "running", endsAt: T0 + ACTIVITY_STEPS.breathing[0].ms! });
    expect(tick(r, T0 + 10)).toBe(r);
    r = tick(r, r.endsAt!);
    expect(r.step).toBe(1);
    expect(ACTIVITY_STEPS.breathing[r.step].kind).toBe("in");
  });

  it("pause keeps the time left, resume gives it back, and a paused run never moves", () => {
    let r = startRun("stretching", T0);
    r = pause(r, T0 + 1000);
    expect(r).toMatchObject({ status: "paused", endsAt: null, left: ACTIVITY_STEPS.stretching[0].ms! - 1000 });
    expect(tick(r, T0 + 999_999)).toBe(r);
    expect(pause(r, T0 + 5000)).toBe(r);
    r = resume(r, T0 + 60_000);
    expect(r).toMatchObject({ status: "running", endsAt: T0 + 60_000 + ACTIVITY_STEPS.stretching[0].ms! - 1000, left: null });
    expect(resume(r, T0 + 70_000)).toBe(r);
  });

  it("finding things moves on when all are found; skipping moves on at once", () => {
    let r = advance(startRun("grounding", T0), T0);
    const look = ACTIVITY_STEPS.grounding[r.step];
    expect(look).toMatchObject({ kind: "find", ms: null });
    expect(r.endsAt).toBeNull();
    for (let i = 1; i < look.count!; i++) {
      r = find(r, T0);
      expect(r.found).toBe(i);
    }
    const before = r.step;
    r = find(r, T0);
    expect(r.step).toBe(before + 1);
    expect(r.found).toBe(0);
    expect(skip(r, T0).step).toBe(r.step + 1);
  });

  it("finding does nothing on a step that isn't a finding step, or while paused", () => {
    const r = startRun("grounding", T0);
    expect(find(r, T0)).toBe(r);
    const look = pause(advance(r, T0), T0);
    expect(find(look, T0)).toBe(look);
  });

  it("progress counts breaths for breathing and steps for the others", () => {
    let r = startRun("breathing", T0);
    expect(progressOf(r)).toEqual({ done: 0, total: 3 });
    r = advance(r, T0); // first breath in
    expect(progressOf(r)).toEqual({ done: 0, total: 3 });
    r = advance(advance(r, T0), T0); // second breath in
    expect(progressOf(r)).toEqual({ done: 1, total: 3 });
    let g = startRun("grounding", T0);
    expect(progressOf(g)).toEqual({ done: 0, total: 3 });
    while (g.status !== "done") g = skip(g, T0);
    expect(progressOf(g)).toEqual({ done: 3, total: 3 });
    expect(progressOf(startRun("stretching", T0)).total).toBe(4);
  });

  it("reaching the end marks the run done; nothing moves after that; again starts over", () => {
    let r: Run = startRun("stretching", T0);
    let guard = 0;
    while (r.status !== "done" && guard++ < 50) r = skip(r, T0);
    expect(r.status).toBe("done");
    expect(ACTIVITY_STEPS.stretching[r.step].kind).toBe("done");
    expect(skip(r, T0)).toBe(r);
    expect(tick(r, T0 + 1e9)).toBe(r);
    expect(pause(r, T0)).toBe(r);
    expect(restart(r, T0 + 5)).toEqual(startRun("stretching", T0 + 5));
  });
});

describe("the room's rules for Feelio's tools", () => {
  it("an offered activity waits for the child; the same offer twice changes nothing", () => {
    const a = withTool(EMPTY_ROOM, tool("offer_activity", { activity: "breathing" }), can);
    expect(a.offer).toEqual({ kind: "activity", activity: "breathing" });
    expect(a.run).toBeNull();
    expect(withTool(a, tool("offer_activity", { activity: "breathing" }), can)).toBe(a);
    expect(withTool(a, tool("offer_activity", { activity: "stretching" }), can).offer).toEqual({ kind: "activity", activity: "stretching" });
  });

  it("only what this child can open: a reached place, a story when stories are open", () => {
    expect(withTool(EMPTY_ROOM, tool("suggest_place", { place: "park" }), can)).toBe(EMPTY_ROOM);
    expect(withTool(EMPTY_ROOM, tool("suggest_place", { place: "home" }), can).offer).toEqual({ kind: "place", place: "home" });
    expect(withTool(EMPTY_ROOM, tool("offer_activity", { activity: "story" }), { ...can, stories: false })).toBe(EMPTY_ROOM);
  });

  it("help always wins: it clears an offer, and nothing else shows while it is open", () => {
    const offered = withTool(EMPTY_ROOM, tool("offer_activity", { activity: "grounding" }), can);
    const help = withTool(offered, tool("show_safety_resources", { kinds: ["trusted_adult"] }), can);
    expect(help).toMatchObject({ help: ["trusted_adult"], offer: null });
    expect(withTool(help, tool("offer_activity", { activity: "breathing" }), can)).toBe(help);
    expect(withTool(help, tool("show_feeling_card", { feeling: "sad" }), can)).toBe(help);
    expect(closeHelp(help).help).toBeNull();
  });

  it("starting an offered activity runs it; tools arriving during it are stale and ignored (help still shows)", () => {
    const offered = withTool(EMPTY_ROOM, tool("offer_activity", { activity: "breathing" }), can);
    const running = acceptOffer(offered, T0);
    expect(running.offer).toBeNull();
    expect(running.run).toMatchObject({ activity: "breathing", status: "running", step: 0 });
    expect(withTool(running, tool("offer_activity", { activity: "stretching" }), can)).toBe(running);
    expect(withTool(running, tool("show_feeling_card", { feeling: "happy" }), can)).toBe(running);
    expect(withTool(running, tool("show_safety_resources", { kinds: ["trusted_adult"] }), can).help).toEqual(["trusted_adult"]);
  });

  it("accepting a story or a place doesn't start a run (the screen navigates)", () => {
    const story = withTool(EMPTY_ROOM, tool("offer_activity", { activity: "story" }), can);
    expect(acceptOffer(story, T0)).toBe(story);
    expect(dismissOffer(story).offer).toBeNull();
  });

  it("leaving an activity remembers it only when the child finished it", () => {
    const running = acceptOffer(withTool(EMPTY_ROOM, tool("offer_activity", { activity: "stretching" }), can), T0);
    expect(endRun(running)).toMatchObject({ run: null, after: null });
    let r = running.run!;
    while (r.status !== "done") r = skip(r, T0);
    expect(endRun({ ...running, run: r })).toMatchObject({ run: null, after: "stretching" });
  });

  it("one phase at a time: an activity outranks the call, a problem outranks the voice state", () => {
    const running = acceptOffer(withTool(EMPTY_ROOM, tool("offer_activity", { activity: "breathing" }), can), T0);
    expect(roomPhase("speaking", null, running)).toBe("activity");
    expect(roomPhase("listening", "mic", EMPTY_ROOM)).toBe("problem");
    expect(roomPhase("lost", null, EMPTY_ROOM)).toBe("lost");
    expect(roomPhase("thinking", null, EMPTY_ROOM)).toBe("thinking");
  });
});

describe("a yes in the talk starts the game (D-076, owner 2026-10-16)", () => {
  const offered = (activity: string) => withTool(EMPTY_ROOM, tool("offer_activity", { activity }), can);

  it("a calm activity Feelio offered during a live talk starts once Feelio has finished speaking", () => {
    expect(startsByVoice(offered("breathing"), "listening")).toBe(true);
    expect(startsByVoice(offered("grounding"), "thinking")).toBe(true);
    expect(startsByVoice(offered("breathing"), "speaking")).toBe(false);
  });

  it("not without a live talk, never a story or a place, never under help or during a run", () => {
    expect(startsByVoice(offered("breathing"), "idle")).toBe(false);
    expect(startsByVoice(offered("breathing"), "ended")).toBe(false);
    expect(startsByVoice(offered("story"), "listening")).toBe(false);
    expect(startsByVoice(withTool(EMPTY_ROOM, tool("suggest_place", { place: "home" }), can), "listening")).toBe(false);
    expect(startsByVoice(EMPTY_ROOM, "listening")).toBe(false);
    expect(startsByVoice({ ...offered("breathing"), help: ["trusted_adult"] }, "listening")).toBe(false);
  });
});
