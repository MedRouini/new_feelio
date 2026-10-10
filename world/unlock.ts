import type { UnlockRule, World } from "./schema";

// The unlock engine (SPEC §4.1). Pure: given the world and the set of completed level ids, it decides
// every place's and level's state. The server runs it; the client only displays the result.

export type PlaceState = "locked" | "unlocked" | "current" | "completed";
export type LevelState = "locked" | "current" | "completed" | "open";

export type WorldState = {
  places: Record<string, { state: PlaceState; levels: Record<string, LevelState>; completedCount: number }>;
  currentPlaceId: string;
};

type Ctx = { done: Set<string>; world: World; previousLevelId: string | null };

function evaluate(rule: UnlockRule, ctx: Ctx): boolean {
  switch (rule.type) {
    case "always":
      return true;
    case "previous_level_completed":
      return ctx.previousLevelId === null || ctx.done.has(ctx.previousLevelId);
    case "levels_completed": {
      const p = ctx.world.places.find((x) => x.id === rule.place);
      return !!p && p.levels.filter((l) => ctx.done.has(l.id)).length >= rule.count;
    }
    case "place_completed": {
      const p = ctx.world.places.find((x) => x.id === rule.place);
      return !!p && p.levels.every((l) => ctx.done.has(l.id));
    }
    case "levels_completed_total":
      return ctx.world.places.flatMap((p) => p.levels).filter((l) => ctx.done.has(l.id)).length >= rule.count;
    case "all_of":
      return rule.rules.every((r) => evaluate(r, ctx));
    case "any_of":
      return rule.rules.some((r) => evaluate(r, ctx));
  }
}

export function computeWorldState(world: World, completedLevelIds: Iterable<string>): WorldState {
  const done = new Set(completedLevelIds);
  const places = [...world.places].sort((a, b) => a.order - b.order);
  const result: WorldState = { places: {}, currentPlaceId: places[0].id };
  let current: string | null = null;

  for (const place of places) {
    const placeOpen = evaluate(place.unlock, { done, world, previousLevelId: null });
    const levels: Record<string, LevelState> = {};
    const sorted = [...place.levels].sort((a, b) => a.order - b.order);
    let currentLevelGiven = false;
    sorted.forEach((lvl, i) => {
      const prev = i === 0 ? null : sorted[i - 1].id;
      if (!placeOpen) levels[lvl.id] = "locked";
      else if (done.has(lvl.id)) levels[lvl.id] = "completed";
      else if (evaluate(lvl.unlock, { done, world, previousLevelId: prev })) {
        levels[lvl.id] = currentLevelGiven ? "open" : "current";
        currentLevelGiven = true;
      } else levels[lvl.id] = "locked";
    });
    const completedCount = sorted.filter((l) => done.has(l.id)).length;
    let state: PlaceState = !placeOpen ? "locked" : completedCount === sorted.length ? "completed" : "unlocked";
    if (state === "unlocked" && current === null) {
      state = "current";
      current = place.id;
    }
    result.places[place.id] = { state, levels, completedCount };
  }

  // Everything finished: the marker rests on the last unlocked place.
  result.currentPlaceId =
    current ?? [...places].reverse().find((p) => result.places[p.id].state !== "locked")?.id ?? places[0].id;
  return result;
}
