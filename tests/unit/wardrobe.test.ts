import { describe, expect, it } from "vitest";
import { EXPECTED_ASSETS } from "@/design/asset-ids";
import { FREE_ITEMS, POINTS_PER_ITEM, WEAR_ITEMS, WEAR_SLOTS, itemById, rewardPoints, stepsToNext, unlockedCount, wearSchema } from "@/child/wardrobe";

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
  it("accepts items in their own body area only", () => {
    expect(wearSchema.safeParse({ head: "party_hat", back: "cape" }).success).toBe(true);
    expect(wearSchema.safeParse({}).success).toBe(true);
    expect(wearSchema.safeParse({ head: "cape" }).success).toBe(false);
    expect(wearSchema.safeParse({ tail: "cape" }).success).toBe(false);
  });
});
