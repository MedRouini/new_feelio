import { describe, expect, it } from "vitest";
import fallback from "@/content/stories/fallback.json";
import { CHOICES, SLOTS } from "@/safety/stories/choices";
import { vettedT0 } from "@/safety/stories/vetted";
import { fits } from "@/safety/stories/write";
import { picturePrompt } from "@/safety/images";

// Story engine (D-070): the vetted text that reaches the picture model, the exact-4-pages shape, and
// the reviewed building blocks.

describe("vetted descriptions and scenes", () => {
  it("allow ordinary picture-book scenes", () => {
    for (const t of [
      "a small orange fox with a fluffy white-tipped tail, big kind eyes and soft round ears",
      "a sunny forest with tall soft trees, mushrooms and glowing flowers",
      "The little fox hugs the small blue ball near a soft green bush, the bee flying close",
    ])
      expect(vettedT0(t, "scene"), t).toEqual({ ok: true });
  });
  it("block people, known characters and writing in pictures", () => {
    expect(vettedT0("a little girl in a red dress", "scene").ok).toBe(false);
    expect(vettedT0("Elsa building a snowman", "scene").ok).toBe(false);
    expect(vettedT0("a comet holding a banner", "scene").ok).toBe(false);
    expect(vettedT0("a shop with a sign", "scene").ok).toBe(false);
    expect(vettedT0("ولد صغير في الحديقة", "description").ok).toBe(false);
  });
  it("every built-in choice and the fallback story pass", () => {
    for (const s of SLOTS) for (const c of CHOICES[s]) expect(vettedT0(c.describe, "scene"), c.describe).toEqual({ ok: true });
    for (const l of ["en", "ar"] as const) {
      expect(vettedT0(fallback[l].heroLook, "scene")).toEqual({ ok: true });
      for (const p of fallback[l].pages) expect(vettedT0(p.scene, "scene"), p.scene).toEqual({ ok: true });
    }
  });
});

describe("story shape", () => {
  it("the fallback stories have exactly 4 pages and fit every age band", () => {
    for (const l of ["en", "ar"] as const) expect(fits(fallback[l], "7-9")).toBe(true);
  });
  it("a story with 3 or 5 pages, or an empty page, is refused (never padded)", () => {
    const s = structuredClone(fallback.en);
    expect(fits({ ...s, pages: s.pages.slice(0, 3) }, "7-9")).toBe(false);
    expect(fits({ ...s, pages: [...s.pages, s.pages[0]] }, "7-9")).toBe(false);
    expect(fits({ ...s, pages: s.pages.map((p, i) => (i === 2 ? { ...p, text: " " } : p)) }, "7-9")).toBe(false);
  });
});

describe("picture prompts", () => {
  it("come from the template and the vetted parts only, and always forbid people and writing", () => {
    const p = picturePrompt("a small orange fox", "the fox in a sunny forest", "page");
    expect(p).toMatch(/children's picture book/);
    expect(p).toMatch(/No people/);
    expect(p).toMatch(/Absolutely no text anywhere/);
  });
});

describe("voice workshop safety net and tools", async () => {
  const { namedChoices } = await import("@/safety/stories/choices");
  const { parseToolCall, STORY_MODEL_TOOLS, MODEL_TOOLS } = await import("@/safety/voice-agent/tools");
  it("finds list choices a child clearly named, one per slot", () => {
    expect(namedChoices("hmm the beach")).toEqual({ place: "beach" });
    expect(namedChoices("a fox please")).toEqual({ hero: "fox" });
    expect(namedChoices("a fox and a bear")).toEqual({}); // two heroes: unclear, leave it to Feelio
    expect(namedChoices("they look for a lost toy")).toEqual({ adventure: "lost_toy" });
    expect(namedChoices("foxglove")).toEqual({});
  });
  it("story tools accept list ids only; free ideas go through story_idea", () => {
    expect(parseToolCall("set_story_choice", '{"slot":"hero","id":"fox"}', STORY_MODEL_TOOLS)).not.toBeNull();
    expect(parseToolCall("set_story_choice", '{"slot":"hero","id":"elsa"}', STORY_MODEL_TOOLS)).toBeNull();
    expect(parseToolCall("story_idea", '{"slot":"feeling","idea":"furious"}', STORY_MODEL_TOOLS)).toBeNull(); // feelings are list-only
    expect(parseToolCall("story_idea", '{"slot":"hero","idea":"a rainbow unicorn"}', STORY_MODEL_TOOLS)).not.toBeNull();
    // The free-talk companion can't fill story slots, and the story guide can't show crisis cards itself.
    expect(parseToolCall("set_story_choice", '{"slot":"hero","id":"fox"}', MODEL_TOOLS)).toBeNull();
    expect(parseToolCall("show_safety_resources", '{"kinds":["trusted_adult"]}', STORY_MODEL_TOOLS)).toBeNull();
  });
});
