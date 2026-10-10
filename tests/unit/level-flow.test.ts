import { describe, expect, it } from "vitest";
import raw from "@/content/worlds/base/world.json";
import { ARTIFACT_CATALOG, DEV_TEST_ARTIFACT, artifactsForLevel } from "@/world/artifacts/catalog";
import { ARTIFACT_LOADERS } from "@/world/artifacts/loaders";
import { EXPECTED_ASSETS } from "@/design/asset-ids";
import { LEVEL_NODE, pick } from "@/design/asset-slots";
import { worldSchema } from "@/world/schema";
import { LEVEL_STATES } from "@/world/unlock";

const world = worldSchema.parse(raw);

describe("level flow foundation (D-056)", () => {
  it("every artifact a level lists is registered, and every registered artifact has a loader", () => {
    for (const p of world.places) for (const l of p.levels) for (const id of l.scenarioIds) expect(ARTIFACT_CATALOG[id], id).toBeDefined();
    for (const id of Object.keys(ARTIFACT_CATALOG)) expect(ARTIFACT_LOADERS[id], id).toBeDefined();
  });

  it("no real artifacts exist yet, so only the dev/test stand-in is offered (never in production)", () => {
    const level = world.places[0].levels[0];
    expect(artifactsForLevel(level)).toEqual([DEV_TEST_ARTIFACT]); // NODE_ENV is "test" here
    const env = process.env as Record<string, string | undefined>;
    const before = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      expect(artifactsForLevel(level)).toEqual([]);
    } finally {
      env.NODE_ENV = before;
    }
  });

  it("every asset world.json refers to is an expected asset (place maps, level icons)", () => {
    for (const p of world.places) {
      expect(EXPECTED_ASSETS[p.map.horizontal.asset as keyof typeof EXPECTED_ASSETS], p.map.horizontal.asset).toBe("landscape");
      expect(EXPECTED_ASSETS[p.map.vertical.asset as keyof typeof EXPECTED_ASSETS], p.map.vertical.asset).toBe("portrait");
      expect(EXPECTED_ASSETS[`loading_place_${p.id}` as keyof typeof EXPECTED_ASSETS]).toBe("square");
      for (const l of p.levels) if (l.icon) expect(EXPECTED_ASSETS[l.icon as keyof typeof EXPECTED_ASSETS], l.icon).toBe("square");
    }
  });

  it("every level state has stone art (a stand-in until its own art is delivered)", () => {
    for (const st of LEVEL_STATES) expect(EXPECTED_ASSETS[pick(LEVEL_NODE[st])]).toBe("square");
  });

  it("place maps are validated: a stone for every level, none for other places' levels", () => {
    const bad = structuredClone(raw) as typeof raw;
    delete (bad.places[0].map.horizontal.stones as Record<string, unknown>)["home-2"];
    expect(worldSchema.safeParse(bad).success).toBe(false);
  });
});
