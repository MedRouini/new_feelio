import { expectedAsset, isDelivered, type AssetId } from "./assets";
import type { LevelState } from "@/world/unlock";

// Asset slots (D-056): every screen asks for a *slot*, never a file. A slot lists asset ids in order
// of preference; the first delivered one is used. New art (docs/ASSET_REQUESTS.md, Batch 3) replaces
// a stand-in the moment it is approved, with no code change. The stand-ins are other approved assets,
// never drawings. When nothing in a slot is delivered, `pick` returns the first id, which renders as a
// grey TODO(PLACEHOLDER) box, and `pickOptional` returns null, so the screen simply leaves it out.

export type Slot = readonly AssetId[];

export function pick<T extends AssetId>(slot: readonly T[]): T {
  return slot.find(isDelivered) ?? slot[0];
}

export function pickOptional<T extends AssetId>(slot: readonly T[]): T | null {
  return slot.find(isDelivered) ?? null;
}

/** Level stones on a place map and in the progress row. */
export const LEVEL_NODE: Record<LevelState, Slot> = {
  locked: ["node_locked"],
  available: ["node_current"],
  in_progress: ["node_in_progress", "node_current"],
  completed: ["node_completed"],
};

/** The three brand companions that bounce in turn as the "working on it" signal on every loading screen. */
export const LOADING_BEAT: readonly [AssetId, AssetId, AssetId] = ["companion_heart", "companion_cloud", "companion_star"];

/** Mascot pose per loading context (child/ui/loading). */
export const LOADING_MASCOT = {
  place: ["mascot_walking_right"],
  level: ["mascot_thinking", "mascot_happy"],
  generic: ["mascot_idle"],
  problem: ["mascot_confused"],
} as const satisfies Record<string, Slot>;

/** The place's own arrival picture shown while its map loads (optional: left out until delivered). */
export function placeArrival(placeId: string): Slot {
  const id = expectedAsset(`loading_place_${placeId}`);
  return id ? [id] : [];
}

/** The place's own map art for one orientation (its id comes from world.json). */
export function placeMapArt(assetId: string): Slot {
  const id = expectedAsset(assetId);
  return id ? [id] : [];
}

/** A level's theme picture next to its stone (optional: left out until delivered). */
export function levelIcon(assetId: string | undefined): Slot {
  const id = expectedAsset(assetId);
  return id ? [id] : [];
}

export const CELEBRATE = {
  mascot: ["mascot_excited", "mascot_feel_excited"],
  burst: ["ui_celebrate_burst"],
  star: ["badge_star"],
} as const satisfies Record<string, Slot>;

/** "This adventure is still being made": honest, never a failure. */
export const NOT_READY_MASCOT = ["mascot_making", "mascot_happy"] as const satisfies Slot;
