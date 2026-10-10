import { z } from "zod";

// world.json schema (docs/ARCHITECTURE.md §5.3). A world pack is data only: adding a place, a level or
// a "Feelio visits ___" pack is a data and asset change, never a code change (SPEC §4.4).

const localized = z.object({ en: z.string().min(1), ar: z.string().min(1) });
const frac = z.number().min(0).max(1);
const point = z.tuple([frac, frac]);

export type UnlockRule =
  | { type: "always" }
  | { type: "previous_level_completed" }
  | { type: "levels_completed"; place: string; count: number }
  | { type: "place_completed"; place: string }
  | { type: "levels_completed_total"; count: number }
  | { type: "all_of"; rules: UnlockRule[] }
  | { type: "any_of"; rules: UnlockRule[] };

// Unknown rule types fail validation (and therefore the build): they can never silently unlock.
export const unlockRule: z.ZodType<UnlockRule> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("always") }),
    z.object({ type: z.literal("previous_level_completed") }),
    z.object({ type: z.literal("levels_completed"), place: z.string(), count: z.number().int().min(1) }),
    z.object({ type: z.literal("place_completed"), place: z.string() }),
    z.object({ type: z.literal("levels_completed_total"), count: z.number().int().min(1) }),
    z.object({ type: z.literal("all_of"), rules: z.array(unlockRule).min(1) }),
    z.object({ type: z.literal("any_of"), rules: z.array(unlockRule).min(1) }),
  ]),
);

const circle = z.object({ x: frac, y: frac, r: z.number().min(0.01).max(0.5) });

/** An oval in map fractions: rx is a fraction of the map width, ry of the map height. */
const oval = z.object({ x: frac, y: frac, rx: z.number().min(0.01).max(0.5), ry: z.number().min(0.01).max(0.5) });

const mapPlace = z.object({
  hotspot: circle,
  /** The stepping stone's top rim, measured from the map art; the current-place ring is fitted to it. */
  pad: oval,
  /** Index of this place's pad in the orientation's path polyline. */
  pathIndex: z.number().int().min(0),
});

const orientationMap = z.object({
  /** Asset ids (keys of design/asset-index) per locale; "en" is the fallback. */
  assets: z.object({ en: z.string() }).catchall(z.string()),
  size: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  /** "painted": place names are part of the art. "blank_signs": code draws them (future languages). */
  labelMode: z.enum(["painted", "blank_signs"]),
  /** Mirroring is only allowed for blank-sign maps (D-021). */
  rtlMirror: z.enum(["none", "mirror"]),
  /** Flat colour of the art's outer meadow, measured from the map: fills any spare space around the
   *  fitted map so the world seems to carry on past its edges (D-054). */
  backdrop: z.string().regex(/^#[0-9a-f]{6}$/),
  path: z.array(point).min(2),
  places: z.record(z.string(), mapPlace),
});

const level = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  title: localized,
  unlock: unlockRule,
  ageBands: z.array(z.enum(["5-6", "7-9", "10-12"])).min(1),
  /** The level's activities ("artifacts", world/artifacts): authored, reviewed scenarios or games
   *  (Milestone 4). Played in order; the level is completed when all are. Empty: not made yet. */
  scenarioIds: z.array(z.string()),
  /** Optional picture of the level's theme on the place map (an asset id, D-056). Shown once delivered. */
  icon: z.string().optional(),
});

/** One orientation of a place's own map (D-056): the art and where each level's stone is on it. */
const placeMapOrientation = z.object({
  /** Asset id of the art (no words in it, so one image serves every language). */
  asset: z.string(),
  size: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  backdrop: z.string().regex(/^#[0-9a-f]{6}$/),
  /** Walking path through the stones, in map fractions. */
  path: z.array(point).min(2),
  /** Level id → its stone (centre and oval in map fractions) and its index in `path`. */
  stones: z.record(z.string(), z.object({ x: frac, y: frac, rx: z.number().min(0.01).max(0.5), ry: z.number().min(0.01).max(0.5), pathIndex: z.number().int().min(0) })),
});

const placeMap = z.object({
  /** true while the stone positions are a temporary layout, before the art exists to measure them. */
  provisional: z.boolean(),
  horizontal: placeMapOrientation,
  vertical: placeMapOrientation,
});

const place = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  name: localized,
  alt: localized,
  unlock: unlockRule,
  levels: z.array(level).min(1),
  voiceContext: localized,
  /** The place's own map with its level stones (D-056). */
  map: placeMap,
});

export const worldSchema = z
  .object({
    schema: z.literal(1),
    pack: z.object({
      id: z.string(),
      name: localized,
      region: z.string().nullable(),
      languages: z.array(z.enum(["en", "ar"])).min(1),
      status: z.enum(["draft", "reviewed", "live"]),
      enabledMarkets: z.array(z.string()).min(1),
      reviewers: z.array(z.string()),
      contentReviewStatus: z.enum(["draft", "expert_reviewed", "approved"]),
      version: z.string(),
    }),
    maps: z.object({ horizontal: orientationMap, vertical: orientationMap }),
    places: z.array(place).min(1),
  })
  .superRefine((w, ctx) => {
    const ids = new Set(w.places.map((p) => p.id));
    for (const o of ["horizontal", "vertical"] as const) {
      const m = w.maps[o];
      for (const id of ids) {
        if (!m.places[id]) ctx.addIssue({ code: "custom", message: `maps.${o} has no position for place "${id}"` });
      }
      for (const [id, mp] of Object.entries(m.places)) {
        if (!ids.has(id)) ctx.addIssue({ code: "custom", message: `maps.${o}.places.${id} is not a place` });
        if (mp.pathIndex >= m.path.length) ctx.addIssue({ code: "custom", message: `maps.${o}.places.${id}.pathIndex out of range` });
      }
      if (m.rtlMirror === "mirror" && m.labelMode !== "blank_signs") {
        ctx.addIssue({ code: "custom", message: `maps.${o}: a map with painted words must never be mirrored (D-021)` });
      }
    }
    for (const p of w.places) {
      for (const o of ["horizontal", "vertical"] as const) {
        const pm = p.map[o];
        const stones = Object.keys(pm.stones);
        for (const l of p.levels) {
          if (!pm.stones[l.id]) ctx.addIssue({ code: "custom", message: `places.${p.id}.map.${o} has no stone for level "${l.id}"` });
        }
        for (const id of stones) {
          if (!p.levels.some((l) => l.id === id)) ctx.addIssue({ code: "custom", message: `places.${p.id}.map.${o}.stones.${id} is not a level of ${p.id}` });
          if (pm.stones[id].pathIndex >= pm.path.length) ctx.addIssue({ code: "custom", message: `places.${p.id}.map.${o}.stones.${id}.pathIndex out of range` });
        }
      }
    }
    const levelIds = w.places.flatMap((p) => p.levels.map((l) => l.id));
    if (new Set(levelIds).size !== levelIds.length) ctx.addIssue({ code: "custom", message: "level ids must be unique" });
  });

export type World = z.infer<typeof worldSchema>;
export type WorldPlace = World["places"][number];
export type WorldLevel = WorldPlace["levels"][number];
export type Orientation = keyof World["maps"];
