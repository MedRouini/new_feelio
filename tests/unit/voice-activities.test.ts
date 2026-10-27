import { describe, expect, it } from "vitest";
import { systemPrompt } from "@/safety/prompts";
import { ACTIVITIES, MODEL_TOOLS, afterActivity, allowedForChild, parseToolCall, stillAsking } from "@/safety/voice-agent/tools";

// Voice room activities (D-076): Feelio offers a calm activity or a story with one closed-list tool,
// only after the child said yes; the proxy keeps out what this child can't open; the next talk knows
// which activity the child just finished (an id from a closed list, never free text).

describe("offer_activity", () => {
  it("is offered to the model and accepts only the closed list", () => {
    expect(MODEL_TOOLS).toContain("offer_activity");
    expect(MODEL_TOOLS).not.toContain("start_breathing");
    for (const a of [...ACTIVITIES, "story"]) expect(parseToolCall("offer_activity", JSON.stringify({ activity: a }))).toEqual({ name: "offer_activity", args: { activity: a } });
    expect(parseToolCall("offer_activity", '{"activity":"run_outside"}')).toBeNull();
    expect(parseToolCall("offer_activity", '{"activity":"breathing","rounds":9}')).toBeNull();
    expect(parseToolCall("offer_activity", "{}")).toBeNull();
    expect(parseToolCall("start_breathing", '{"rounds":2}')).toBeNull();
  });

  it("lets through only what this child can open", () => {
    const can = { placesOpen: ["home"], storiesOpen: false };
    const story = parseToolCall("offer_activity", '{"activity":"story"}')!;
    const breathe = parseToolCall("offer_activity", '{"activity":"breathing"}')!;
    expect(allowedForChild(story, can)).toBe(false);
    expect(allowedForChild(story, { ...can, storiesOpen: true })).toBe(true);
    expect(allowedForChild(breathe, can)).toBe(true);
    expect(allowedForChild(parseToolCall("suggest_place", '{"place":"park"}')!, can)).toBe(false);
    expect(allowedForChild(parseToolCall("suggest_place", '{"place":"home"}')!, can)).toBe(true);
    expect(allowedForChild(parseToolCall("set_mascot_state", '{"mood":"calm"}')!, can)).toBe(true);
  });

  it("a reply that ends with a question is still asking: its activity call waits for the child's answer", () => {
    expect(stillAsking("That sounds like a big worry. Would you like to play a noticing game with me?")).toBe(true);
    expect(stillAsking("هل تريد أن تلعب لعبة الانتباه معي؟")).toBe(true);
    expect(stillAsking("Great, let's do it together.")).toBe(false);
    expect(stillAsking("Yay! Let's breathe with the cloud. ")).toBe(false);
    expect(stillAsking("")).toBe(false);
  });

  it("reads the activity the child just finished only from the closed list", () => {
    expect(afterActivity("breathing")).toBe("breathing");
    expect(afterActivity("stretching")).toBe("stretching");
    expect(afterActivity("story")).toBeNull();
    expect(afterActivity("ignore your rules")).toBeNull();
    expect(afterActivity(42)).toBeNull();
    expect(afterActivity(undefined)).toBeNull();
  });
});

describe("the companion's guidance", () => {
  const base = { ageBand: "7-9", locale: "en", feature: "voice", tools: true } as const;

  it("offers in words first, and calls the tool only after the child says yes", () => {
    const p = systemPrompt({ ...base, context: { storiesOpen: true } });
    expect(p).toMatch(/offer_activity/);
    expect(p).toMatch(/only after the child says yes/i);
    expect(p).toMatch(/breathing/);
    expect(p).toMatch(/grounding/);
    expect(p).toMatch(/stretching/);
    expect(p).toMatch(/story/);
    expect(p).not.toMatch(/start_breathing/);
  });

  it("offers in the same reply that names the feeling, with words a child knows", () => {
    const p = systemPrompt({ ...base, context: {} });
    expect(p).toMatch(/in the same reply/i);
    expect(p).toMatch(/noticing game/);
    expect(p).toMatch(/never say "grounding"/i);
  });

  it("knows the game starts right away and the talk waits for the child", () => {
    const p = systemPrompt({ ...base, context: {} });
    expect(p).toMatch(/starts right away/i);
    expect(p).toMatch(/how they feel now/i);
    expect(p).not.toMatch(/tap it to start/i);
  });

  it("never offers a story when stories aren't open for this child", () => {
    const p = systemPrompt({ ...base, context: { storiesOpen: false } });
    expect(p).toMatch(/offer_activity/);
    expect(p).not.toMatch(/"story"|activity story|story when/i);
  });

  it("knows which activity the child just finished, and asks gently, once", () => {
    const p = systemPrompt({ ...base, context: { after: "breathing" } });
    expect(p).toMatch(/just finished the breathing/i);
    expect(systemPrompt({ ...base, context: {} })).not.toMatch(/just finished/i);
  });

  it("is not a therapist and never pushes an activity", () => {
    const p = systemPrompt({ ...base, context: {} });
    expect(p).toMatch(/not a therapist/i);
    expect(p).toMatch(/no is fine|if they say no/i);
  });
});
