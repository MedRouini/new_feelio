import data from "@/content/stories/choices.json";

// Story building blocks (docs/STORIES.md, D-070): four slots, each from a curated list, or (hero, place,
// adventure only) a child's own idea that the safety layer checked and turned into a vetted description
// (ideas.ts). The feeling is always from the list: the emotional frame of a story is never free text.
// Client-safe: no secrets, no provider calls.

export const SLOTS = ["hero", "place", "feeling", "adventure"] as const;
export type Slot = (typeof SLOTS)[number];
/** Slots that may take a child's own (checked) idea. */
export const IDEA_SLOTS = ["hero", "place", "adventure"] as const satisfies readonly Slot[];

export type Choice = {
  /** A list id, or "idea:<hash>" for a checked idea. */
  id: string;
  en: string;
  ar: string;
  /** The vetted English description the story and picture models see. Never the child's own words. */
  describe: string;
};

export const CHOICES = data.slots as Record<Slot, Choice[]>;
export const CHOICE_IDS = Object.fromEntries(SLOTS.map((s) => [s, CHOICES[s].map((c) => c.id)])) as Record<Slot, string[]>;
export const FEELINGS = CHOICE_IDS.feeling;

export function choice(slot: Slot, id: string): Choice | null {
  return CHOICES[slot].find((c) => c.id === id) ?? null;
}

export type StoryRecipe = Record<Slot, Choice>;

/** Words that name a list choice in what a child says (English; Arabic relies on the model for now). */
const WORDS: Record<string, string[]> = {
  fox: ["fox"], bear: ["bear"], bunny: ["bunny", "rabbit"], owl: ["owl"], turtle: ["turtle", "tortoise"], dragon: ["dragon"], cat: ["cat", "kitten", "kitty"], penguin: ["penguin"],
  forest: ["forest", "woods"], beach: ["beach", "seaside"], space: ["space", "planets", "stars"], castle: ["castle"], garden: ["garden"], underwater: ["underwater", "under the sea", "ocean"],
  happy: ["happy"], sad: ["sad"], angry: ["angry", "mad", "cross"], worried: ["worried", "scared", "nervous"], jealous: ["jealous"], proud: ["proud"], lonely: ["lonely", "alone"], excited: ["excited"],
  lost_toy: ["lost toy", "lost his toy", "lost her toy", "toy"], new_friend: ["new friend", "friend"], big_race: ["race"], birthday: ["birthday", "party"], storm: ["storm", "thunder"], first_day: ["first day"],
};

/**
 * The list choices a child clearly named in one message, by slot (only when exactly one item of that
 * slot is named). A safety net for when the voice model agrees but forgets to call its tool.
 */
export function namedChoices(said: string): Partial<Record<Slot, string>> {
  const text = ` ${said.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ")} `;
  const out: Partial<Record<Slot, string>> = {};
  for (const slot of SLOTS) {
    const hits = CHOICES[slot].filter((c) => (WORDS[c.id] ?? []).some((w) => text.includes(` ${w} `)));
    if (hits.length === 1) out[slot] = hits[0].id;
  }
  return out;
}
