import type { UnlockRule, World } from "./schema";

// The unlock engine (SPEC §4.1). Pure: given the world, the completed level ids and the started ones,
// it decides every place's and level's state. The server runs it; the client only displays the result.

export type PlaceState = "locked" | "unlocked" | "current" | "completed";
/**
 * Level states (D-056):
 * - locked: not reachable yet (its unlock rule isn't met, or its place is locked)
 * - available: reachable, not started
 * - in_progress: started (an activity opened or finished) but not all of its activities completed
 * - completed: every activity of the level is completed; it can be replayed
 */
export type LevelState = "locked" | "available" | "in_progress" | "completed";
export const LEVEL_STATES: readonly LevelState[] = ["locked", "available", "in_progress", "completed"];

export type PlaceProgress = {
  state: PlaceState;
  levels: Record<string, LevelState>;
  /** The level to play next: the first reachable one that isn't completed (null when all are done). */
  currentLevelId: string | null;
  completedCount: number;
  total: number;
};

export type WorldState = {
  places: Record<string, PlaceProgress>;
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

export function computeWorldState(world: World, completedLevelIds: Iterable<string>, startedLevelIds: Iterable<string> = []): WorldState {
  const done = new Set(completedLevelIds);
  const started = new Set(startedLevelIds);
  const places = [...world.places].sort((a, b) => a.order - b.order);
  const result: WorldState = { places: {}, currentPlaceId: places[0].id };
  let current: string | null = null;

  for (const place of places) {
    const placeOpen = evaluate(place.unlock, { done, world, previousLevelId: null });
    const levels: Record<string, LevelState> = {};
    const sorted = [...place.levels].sort((a, b) => a.order - b.order);
    let currentLevelId: string | null = null;
    sorted.forEach((lvl, i) => {
      const prev = i === 0 ? null : sorted[i - 1].id;
      if (!placeOpen) levels[lvl.id] = "locked";
      else if (done.has(lvl.id)) levels[lvl.id] = "completed";
      else if (evaluate(lvl.unlock, { done, world, previousLevelId: prev })) {
        levels[lvl.id] = started.has(lvl.id) ? "in_progress" : "available";
        currentLevelId ??= lvl.id;
      } else levels[lvl.id] = "locked";
    });
    const completedCount = sorted.filter((l) => done.has(l.id)).length;
    let state: PlaceState = !placeOpen ? "locked" : completedCount === sorted.length ? "completed" : "unlocked";
    if (state === "unlocked" && current === null) {
      state = "current";
      current = place.id;
    }
    result.places[place.id] = { state, levels, currentLevelId, completedCount, total: sorted.length };
  }

  // Everything finished: the marker rests on the last unlocked place.
  result.currentPlaceId =
    current ?? [...places].reverse().find((p) => result.places[p.id].state !== "locked")?.id ?? places[0].id;
  return result;
}

/** What a completion changed, for the celebration screen: the next level and any newly opened places. */
export function diffUnlocks(world: World, before: WorldState, after: WorldState, placeId: string) {
  const place = world.places.find((p) => p.id === placeId);
  const nextLevelId = after.places[placeId]?.currentLevelId ?? null;
  const nextLevelOpened = !!nextLevelId && before.places[placeId]?.levels[nextLevelId] === "locked";
  const openedPlaceIds = world.places
    .filter((p) => before.places[p.id].state === "locked" && after.places[p.id].state !== "locked")
    .map((p) => p.id);
  return { placeCompleted: !!place && after.places[placeId].state === "completed", nextLevelId, nextLevelOpened, openedPlaceIds };
}
