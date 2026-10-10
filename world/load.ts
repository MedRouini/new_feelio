import { RAW_PACKS } from "./packs.generated";
import { worldSchema, type World } from "./schema";

const cache = new Map<string, World>();

/** Loads and validates a world pack by id. Packs are discovered at build time (packs.generated.ts). */
export function loadWorld(packId = "base"): World {
  const hit = cache.get(packId);
  if (hit) return hit;
  const raw = RAW_PACKS[packId];
  if (!raw) throw new Error(`Unknown world pack "${packId}"`);
  const world = worldSchema.parse(raw);
  cache.set(packId, world);
  return world;
}

export function listPacks(): string[] {
  return Object.keys(RAW_PACKS);
}
