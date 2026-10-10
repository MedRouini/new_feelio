import { describe, expect, it } from "vitest";
import raw from "@/content/worlds/base/world.json";
import { clampPan, centreOn, coverScale, facingAt, pointAt, subPath, type Pt } from "@/world/geometry";
import { worldSchema } from "@/world/schema";
import { computeWorldState } from "@/world/unlock";

const world = worldSchema.parse(raw);
const levels = (place: string, n: number) => Array.from({ length: n }, (_, i) => `${place}-${i + 1}`);

describe("world.json (base pack)", () => {
  it("validates, with 5 places in path order and 5 levels each", () => {
    expect(world.places.map((p) => p.id)).toEqual(["home", "park", "school", "club", "market"]);
    for (const p of world.places) expect(p.levels).toHaveLength(5);
  });

  it("every place has a position in both orientations and EN/AR names", () => {
    for (const o of ["horizontal", "vertical"] as const) {
      for (const p of world.places) expect(world.maps[o].places[p.id]).toBeDefined();
    }
    for (const p of world.places) expect(p.name.ar).toMatch(/[؀-ۿ]/);
  });

  it("pads lie on the path in walking order", () => {
    for (const o of ["horizontal", "vertical"] as const) {
      const idx = world.places.map((p) => world.maps[o].places[p.id].pathIndex);
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    }
  });

  it("rejects mirroring a map with painted words (D-021) and unknown unlock rules", () => {
    const bad = structuredClone(raw) as typeof raw;
    (bad.maps.horizontal as { rtlMirror: string }).rtlMirror = "mirror";
    expect(worldSchema.safeParse(bad).success).toBe(false);
    const bad2 = structuredClone(raw) as typeof raw;
    (bad2.places[1].unlock as { type: string }).type = "pay_to_unlock";
    expect(worldSchema.safeParse(bad2).success).toBe(false);
  });
});

describe("unlock engine", () => {
  it("a new child: Home is current, everything else locked, level 1 current", () => {
    const s = computeWorldState(world, []);
    expect(s.currentPlaceId).toBe("home");
    expect(s.places.home.state).toBe("current");
    expect(s.places.park.state).toBe("locked");
    expect(s.places.home.levels["home-1"]).toBe("current");
    expect(s.places.home.levels["home-2"]).toBe("locked");
  });

  it("levels unlock one by one", () => {
    const s = computeWorldState(world, ["home-1"]);
    expect(s.places.home.levels["home-1"]).toBe("completed");
    expect(s.places.home.levels["home-2"]).toBe("current");
  });

  it("3 Home levels unlock the Park, which becomes the current place only after Home is finished", () => {
    const s = computeWorldState(world, levels("home", 3));
    expect(s.places.park.state).toBe("unlocked");
    expect(s.currentPlaceId).toBe("home");
    const s2 = computeWorldState(world, levels("home", 5));
    expect(s2.places.home.state).toBe("completed");
    expect(s2.currentPlaceId).toBe("park");
  });

  it("everything finished: the marker rests on the last place; replay stays possible", () => {
    const all = world.places.flatMap((p) => p.levels.map((l) => l.id));
    const s = computeWorldState(world, all);
    expect(Object.values(s.places).every((p) => p.state === "completed")).toBe(true);
    expect(s.currentPlaceId).toBe("market");
  });

  it("ignores unknown level ids (no unlocking by forged progress)", () => {
    expect(computeWorldState(world, ["market-5", "nope"]).places.market.state).toBe("locked");
  });
});

describe("geometry", () => {
  const line: Pt[] = [[0, 0], [10, 0], [10, 10]];
  it("pointAt walks at constant speed along the polyline", () => {
    expect(pointAt(line, 0)).toEqual([0, 0]);
    expect(pointAt(line, 0.5)).toEqual([10, 0]);
    expect(pointAt(line, 0.75)).toEqual([10, 5]);
    expect(pointAt(line, 1)).toEqual([10, 10]);
  });
  it("subPath reverses when walking backwards; facing follows the screen direction", () => {
    expect(subPath(line, 2, 0)).toEqual([[10, 10], [10, 0], [0, 0]]);
    expect(facingAt([[0, 0], [10, 0]], 0.5)).toBe("right");
    expect(facingAt([[10, 0], [0, 0]], 0.5)).toBe("left");
  });
  it("camera: cover scale and clamping keep the art covering the viewport", () => {
    const stage = { w: 1500, h: 1000 };
    const view = { w: 1000, h: 1000 };
    expect(coverScale(stage, view)).toBe(1);
    expect(clampPan(100, 100, 1, stage, view)).toEqual({ x: 0, y: 0 });
    expect(clampPan(-9999, -9999, 1, stage, view)).toEqual({ x: -500, y: 0 });
    expect(centreOn(750, 500, 1, stage, view)).toEqual({ x: -250, y: 0 });
  });
});
