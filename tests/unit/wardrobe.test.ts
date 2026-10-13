import { describe, expect, it } from "vitest";
import { EXPECTED_ASSETS } from "@/design/asset-ids";
import { avatarSchema } from "@/child/options";
import { FREE_ITEMS, POINTS_PER_ITEM, WEAR_ITEMS, WEAR_SLOTS, itemById, rewardPoints, stepsToNext, unlockedCount, wearSchema, wornLayers } from "@/child/wardrobe";

describe("wardrobe data", () => {
  it("has 16 unique items, 4 per body area, each with expected art and a sane placement", () => {
    expect(WEAR_ITEMS).toHaveLength(16);
    expect(new Set(WEAR_ITEMS.map((i) => i.id)).size).toBe(16);
    for (const s of WEAR_SLOTS) expect(WEAR_ITEMS.filter((i) => i.slot === s)).toHaveLength(4);
    for (const i of WEAR_ITEMS) {
      expect(i.asset in EXPECTED_ASSETS, i.asset).toBe(true);
      expect(i.en.length).toBeGreaterThan(0);
      expect(i.ar.length).toBeGreaterThan(0);
      for (const v of [i.placement.x, i.placement.y]) expect(v >= 0 && v <= 1).toBe(true);
      expect(i.placement.w > 0 && i.placement.w <= 1.4).toBe(true);
    }
    expect(itemById("party_hat")?.slot).toBe("head");
    expect(itemById("nope")).toBeUndefined();
  });
  it("has the room scene and objects among the expected assets", () => {
    for (const id of ["scene_my_room_land", "scene_my_room_port", "room_wardrobe", "room_gift_box", "room_star_shelf", "room_feelings_jar", "room_pinboard", "room_book_stack"]) {
      expect(id in EXPECTED_ASSETS, id).toBe(true);
    }
  });
});

describe("unlock maths", () => {
  it("counts stories, feelings (max 8) and levels (2 each)", () => {
    expect(rewardPoints({ stories: 0, feelings: 0, levels: 0 })).toBe(0);
    expect(rewardPoints({ stories: 2, feelings: 1, levels: 0 })).toBe(3);
    expect(rewardPoints({ stories: 0, feelings: 20, levels: 0 })).toBe(8);
    expect(rewardPoints({ stories: 0, feelings: 0, levels: 3 })).toBe(6);
  });
  it("gives the free items at 0 points, one more every 3 points, capped at 16", () => {
    expect(unlockedCount(0)).toBe(FREE_ITEMS);
    expect(unlockedCount(POINTS_PER_ITEM - 1)).toBe(FREE_ITEMS);
    expect(unlockedCount(POINTS_PER_ITEM)).toBe(FREE_ITEMS + 1);
    expect(unlockedCount(1000)).toBe(16);
  });
  it("counts the steps to the next item from what is already reached", () => {
    expect(stepsToNext(0, 2)).toBe(3);
    expect(stepsToNext(2, 2)).toBe(1);
    expect(stepsToNext(3, 3)).toBe(3);
    expect(stepsToNext(0, 3)).toBe(6); // reached stays high after a story was deleted
    expect(stepsToNext(999, 16)).toBeNull();
  });
});

describe("wearSchema", () => {
  it("keeps items in their own body area and drops anything else", () => {
    expect(wearSchema.parse({ head: "party_hat", back: "cape" })).toEqual({ head: "party_hat", back: "cape" });
    expect(wearSchema.parse({})).toEqual({});
    expect(wearSchema.parse({ head: "cape" }).head).toBeUndefined();
    expect(wearSchema.parse({ tail: "cape" })).toEqual({});
  });
});

describe("avatar with items", () => {
  it("keeps version 1 records valid and accepts wear", () => {
    expect(avatarSchema.safeParse({ v: 1, shape: "bun", colour: "amber", companion: "star" }).success).toBe(true);
    expect(avatarSchema.safeParse({ v: 1, shape: "bun", colour: "amber", companion: "star", wear: { head: "party_hat" } }).success).toBe(true);
    expect(avatarSchema.parse({ v: 1, shape: "bun", colour: "amber", companion: "star", wear: { head: "cape" } }).wear?.head).toBeUndefined();
  });
  it("splits worn items into behind and front layers, leaving out undelivered art", () => {
    const all = () => true;
    const l = wornLayers({ head: "party_hat", back: "cape" }, all);
    expect(l.behind.map((i) => i.id)).toEqual(["cape"]);
    expect(l.front.map((i) => i.id)).toEqual(["party_hat"]);
    expect(wornLayers({ head: "party_hat" }, () => false)).toEqual({ behind: [], front: [] });
    expect(wornLayers(undefined, all)).toEqual({ behind: [], front: [] });
  });
});

describe("review fix: an unknown worn item never resets the character", () => {
  it("drops only the unknown item and keeps the colour", () => {
    const r = avatarSchema.safeParse({ v: 1, shape: "bun", colour: "rose", companion: "star", wear: { head: "old_renamed_hat", face: "round_glasses" } });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.colour).toBe("rose");
      expect(r.data.wear).toEqual({ face: "round_glasses" });
    }
  });
});
