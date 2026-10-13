import { z } from "zod";
import data from "@/content/room/wardrobe.json";
import type { AssetId } from "@/design/asset-ids";

// My room (D-074): the wearable items, in unlock order, and the unlock maths. Client-safe: shared by
// the room UI, the Avatar layers and the server validator. Nothing here is personal data.

export const WEAR_SLOTS = ["head", "face", "neck", "back"] as const;
export type WearSlot = (typeof WEAR_SLOTS)[number];
export type Placement = { x: number; y: number; w: number; rotate: number; behind: boolean };
export type WearItem = { id: string; slot: WearSlot; asset: AssetId; en: string; ar: string; placement: Placement; provisional: boolean };

export const WEAR_ITEMS = data.items as WearItem[];
/** Items open from the start, so dress-up works on day one. */
export const FREE_ITEMS = 2;
/** Points per further item. */
export const POINTS_PER_ITEM = 3;
/** Distinct feelings in the story list: the most the feelings source can give. */
const MAX_FEELINGS = 8;

export function itemById(id: string): WearItem | undefined {
  return WEAR_ITEMS.find((i) => i.id === id);
}

/** 1 per story made, 1 per distinct feeling met (at most 8), 2 per finished level. */
export function rewardPoints(p: { stories: number; feelings: number; levels: number }): number {
  return p.stories + Math.min(p.feelings, MAX_FEELINGS) + 2 * p.levels;
}

/** How many items these points open (free items included), capped at the wardrobe's size. */
export function unlockedCount(points: number): number {
  return Math.min(WEAR_ITEMS.length, FREE_ITEMS + Math.floor(points / POINTS_PER_ITEM));
}

/** Steps (points) still needed for the next item after `reached`; null when everything is open. */
export function stepsToNext(points: number, reached: number): number | null {
  if (reached >= WEAR_ITEMS.length) return null;
  const needed = (reached - FREE_ITEMS + 1) * POINTS_PER_ITEM;
  return Math.max(1, needed - points);
}

const idsFor = (slot: WearSlot) => WEAR_ITEMS.filter((i) => i.slot === slot).map((i) => i.id) as [string, ...string[]];

/** What the character wears: at most one item per body area, each from that area's list. */
export const wearSchema = z
  .object({
    head: z.enum(idsFor("head")).optional(),
    face: z.enum(idsFor("face")).optional(),
    neck: z.enum(idsFor("neck")).optional(),
    back: z.enum(idsFor("back")).optional(),
  })
  .strict();
export type Wear = z.infer<typeof wearSchema>;

/** The worn items to draw, behind and in front of the body; items without delivered art are left out. */
export function wornLayers(wear: Wear | undefined, delivered: (asset: AssetId) => boolean): { behind: WearItem[]; front: WearItem[] } {
  const items = WEAR_SLOTS.map((s) => (wear?.[s] ? itemById(wear[s]!) : undefined)).filter((i): i is WearItem => !!i && delivered(i.asset));
  return { behind: items.filter((i) => i.placement.behind), front: items.filter((i) => !i.placement.behind) };
}
