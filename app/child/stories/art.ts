import type { Slot as AssetSlot } from "@/design/asset-slots";
import type { AssetId } from "@/design/asset-ids";

// Story art slots (D-070, Batch 4). Every one is optional: until it is delivered the screens use an
// approved stand-in from the slot, or show the words alone (never a drawing in code).
export const STORY_ART = {
  reader: ["mascot_reading", "mascot_pointing", "mascot_happy"],
  wand: ["ui_story_wand"],
  slot: ["ui_story_slot"],
  feelioMood: {
    happy: ["mascot_happy"],
    excited: ["mascot_feel_excited", "mascot_excited"],
    empathy: ["mascot_feel_sad", "mascot_idle"],
    calm: ["mascot_idle"],
    thinking: ["mascot_thinking", "mascot_idle"],
  },
} as const satisfies { reader: AssetSlot; wand: AssetSlot; slot: AssetSlot; feelioMood: Record<string, AssetSlot> };

/** The picture for one choice of a slot, if one is delivered (feelings use the brand faces). */
export function choiceArt(slot: "hero" | "place" | "feeling" | "adventure", id: string): AssetId[] {
  if (slot === "feeling") return [`face_${id}` as AssetId];
  const prefix = slot === "hero" ? "story_hero_" : slot === "place" ? "story_place_" : "story_adv_";
  return [`${prefix}${id}` as AssetId];
}
