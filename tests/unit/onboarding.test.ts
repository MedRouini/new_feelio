import { describe, expect, it } from "vitest";
import nicknames from "@/content/nicknames.json";
import { INTERESTS, NICKNAMES, onboardingUpdateSchema } from "@/child/options";
import { AVATAR_COLOURS, AVATAR_POSES, AVATAR_SHAPES, EXPECTED_ASSETS } from "@/design/asset-ids";

describe("onboarding input (fixed lists only, ONBOARDING.md §4)", () => {
  const ok = { step: 2, avatar: { v: 1, shape: "bean", colour: "sky", companion: "heart" }, nickname: "pip", interests: ["space", "music"] };

  it("accepts values from the lists", () => {
    expect(onboardingUpdateSchema.safeParse(ok).success).toBe(true);
    expect(onboardingUpdateSchema.safeParse({ step: 3, nickname: "parent" }).success).toBe(true);
  });

  it("rejects free text, unknown values, extra fields and too many interests", () => {
    const bad = [
      { ...ok, nickname: "Sami Ahmed" },
      { ...ok, avatar: { ...ok.avatar, colour: "black" } },
      { ...ok, interests: ["space", "music", "sea", "animals"] },
      { ...ok, interests: ["guns"] },
      { ...ok, step: 9 },
      { ...ok, name: "typed by a child" },
    ];
    for (const b of bad) expect(onboardingUpdateSchema.safeParse(b).success, JSON.stringify(b)).toBe(false);
  });

  it("the nickname list has EN and AR for every entry and unique keys", () => {
    expect(new Set(NICKNAMES.map((n) => n.key)).size).toBe(NICKNAMES.length);
    for (const n of nicknames.names) {
      expect(n.en.length).toBeGreaterThan(0);
      expect(n.ar).toMatch(/[؀-ۿ]/);
    }
  });

  it("every avatar combination and every interest has an expected asset id", () => {
    for (const s of AVATAR_SHAPES) for (const c of AVATAR_COLOURS) for (const p of AVATAR_POSES) expect(EXPECTED_ASSETS[`avatar_${s}_${c}_${p}`]).toBe("square");
    for (const i of INTERESTS) expect(EXPECTED_ASSETS[`like_${i}` as keyof typeof EXPECTED_ASSETS]).toBe("square");
  });
});
