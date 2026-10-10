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

const mapPlace = z.object({
  hotspot: circle,
  pad: circle,
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
  path: z.array(point).min(2),
  places: z.record(z.string(), mapPlace),
});

const level = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  title: localized,
  unlock: unlockRule,
  ageBands: z.array(z.enum(["5-6", "7-9", "10-12"])).min(1),
  /** Authored, reviewed scenarios (Milestone 4). Empty means the level has no content yet. */
  scenarioIds: z.array(z.string()),
});

const place = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  name: localized,
  alt: localized,
  unlock: unlockRule,
  levels: z.array(level).min(1),
  voiceContext: localized,
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
    const levelIds = w.places.flatMap((p) => p.levels.map((l) => l.id));
    if (new Set(levelIds).size !== levelIds.length) ctx.addIssue({ code: "custom", message: "level ids must be unique" });
  });

export type World = z.infer<typeof worldSchema>;
export type WorldPlace = World["places"][number];
export type WorldLevel = WorldPlace["levels"][number];
export type Orientation = keyof World["maps"];
