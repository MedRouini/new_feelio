import { z } from "zod";
import { WORLD_PLACE_IDS } from "@/design/asset-ids";
import { CHOICE_IDS } from "../stories/choices";

// The voice companion's client tools (ARCHITECTURE §4.2, MASCOT.md, D-068): the one contract shared by
// the agent sync script (what ElevenLabs knows), the safety proxy (what it may emit) and the Talk screen
// (what it shows). Every tool only changes what the child's screen shows; none reaches the network,
// stores anything or acts on its own. Arguments are closed lists, validated on both sides.

export const MASCOT_MOODS = ["happy", "excited", "empathy", "calm"] as const;
export const FEELINGS = ["happy", "sad", "angry", "excited"] as const;
export const RESOURCE_KINDS = ["trusted_adult", "emergency_number", "child_helpline", "crisis_line", "report_exploitation"] as const;
/** The calm activities of the voice room (D-076); "story" opens the story theatre instead. */
export const ACTIVITIES = ["breathing", "grounding", "stretching"] as const;
export type Activity = (typeof ACTIVITIES)[number];
export type Offerable = Activity | "story";

export const TOOL_ARGS = {
  set_mascot_state: z.strictObject({ mood: z.enum(MASCOT_MOODS) }),
  show_feeling_card: z.strictObject({ feeling: z.enum(FEELINGS) }),
  offer_activity: z.strictObject({ activity: z.enum([...ACTIVITIES, "story"]) }),
  suggest_place: z.strictObject({ place: z.enum(WORLD_PLACE_IDS) }),
  show_safety_resources: z.strictObject({ kinds: z.array(z.enum(RESOURCE_KINDS)).min(1).max(RESOURCE_KINDS.length) }),
  /** Story workshop, server tools (D-070): handled by our proxy, never sent to the app. */
  set_story_choice: z.strictObject({
    slot: z.enum(["hero", "place", "feeling", "adventure"]),
    id: z.enum([...CHOICE_IDS.hero, ...CHOICE_IDS.place, ...CHOICE_IDS.feeling, ...CHOICE_IDS.adventure] as [string, ...string[]]),
  }),
  story_idea: z.strictObject({ slot: z.enum(["hero", "place", "adventure"]), idea: z.string().min(1).max(160) }),
  /** Story workshop (D-070): the server filled a slot (list choice or checked idea); the screen shows it. */
  show_story_choice: z.strictObject({
    slot: z.enum(["hero", "place", "feeling", "adventure"]),
    id: z.string().regex(/^(idea:[0-9a-f]{12}|[a-z_]{2,24})$/),
    en: z.string().min(1).max(60),
    ar: z.string().min(1).max(60),
  }),
} as const;

export type ToolName = keyof typeof TOOL_ARGS;
export type ToolCall = { [K in ToolName]: { name: K; args: z.infer<(typeof TOOL_ARGS)[K]> } }[ToolName];

/** Tools the model may choose. `show_safety_resources` is never offered: only the router emits it (crisis). */
export const MODEL_TOOLS = ["set_mascot_state", "show_feeling_card", "offer_activity", "suggest_place"] as const satisfies readonly ToolName[];
/** In the story workshop: the mood, and the two server tools that fill the story's slots. */
export const STORY_MODEL_TOOLS = ["set_mascot_state", "set_story_choice", "story_idea"] as const satisfies readonly ToolName[];
/** Tools the proxy handles itself (never forwarded to ElevenLabs or the app). */
export const SERVER_TOOLS = ["set_story_choice", "story_idea"] as const satisfies readonly ToolName[];

type JsonSchema = { type: "object"; properties: Record<string, unknown>; required: string[] };

export const TOOL_DEFS: Record<ToolName, { description: string; parameters: JsonSchema }> = {
  set_mascot_state: {
    description: "Changes Feelio's face on the child's screen to match the moment. Use it when the feeling of the talk changes.",
    parameters: {
      type: "object",
      properties: { mood: { type: "string", enum: [...MASCOT_MOODS], description: "happy, excited, empathy (caring, for sad moments) or calm." } },
      required: ["mood"],
    },
  },
  show_feeling_card: {
    description: "Shows a picture of one feeling on the child's screen, to help them name what they feel.",
    parameters: {
      type: "object",
      properties: { feeling: { type: "string", enum: [...FEELINGS], description: "The feeling the child is talking about." } },
      required: ["feeling"],
    },
  },
  offer_activity: {
    description:
      "Puts a short activity on the child's screen, ready for them to tap and start: breathing (slow breaths with a cloud), grounding (noticing things to see, hear and feel), stretching (gentle moves with Feelio) or story (making a story together). Call it only after you offered it in words and the child said yes.",
    parameters: {
      type: "object",
      properties: { activity: { type: "string", enum: [...ACTIVITIES, "story"], description: "breathing, grounding, stretching or story." } },
      required: ["activity"],
    },
  },
  suggest_place: {
    description: "Shows a button to visit one place in Feelio's world. Use it only when the child wants something to do.",
    parameters: {
      type: "object",
      properties: { place: { type: "string", enum: [...WORLD_PLACE_IDS], description: "The place to suggest." } },
      required: ["place"],
    },
  },
  set_story_choice: {
    description: "Saves the child's choice for one part of the story, from the lists you were given (use the exact id).",
    parameters: {
      type: "object",
      properties: {
        slot: { type: "string", enum: ["hero", "place", "feeling", "adventure"], description: "Which part of the story." },
        id: { type: "string", enum: [...CHOICE_IDS.hero, ...CHOICE_IDS.place, ...CHOICE_IDS.feeling, ...CHOICE_IDS.adventure], description: "The id of the chosen item from that part's list." },
      },
      required: ["slot", "id"],
    },
  },
  story_idea: {
    description: "The child said their own idea for the hero, the place or the adventure (not in the lists). Pass the idea in a few words; it will be checked and made into a story ingredient.",
    parameters: {
      type: "object",
      properties: {
        slot: { type: "string", enum: ["hero", "place", "adventure"], description: "Which part of the story." },
        idea: { type: "string", description: "The child's idea, in a few words." },
      },
      required: ["slot", "idea"],
    },
  },
  show_story_choice: {
    description: "Shows a story choice in its slot on the child's screen. Only the server uses this (story workshop).",
    parameters: {
      type: "object",
      properties: {
        slot: { type: "string", enum: ["hero", "place", "feeling", "adventure"], description: "Which slot." },
        id: { type: "string", description: "The choice id." },
        en: { type: "string", description: "English label." },
        ar: { type: "string", description: "Arabic label." },
      },
      required: ["slot", "id", "en", "ar"],
    },
  },
  show_safety_resources: {
    description: "Shows the child who can help them (trusted grown-ups, emergency help). Only the safety layer uses this.",
    parameters: {
      type: "object",
      properties: { kinds: { type: "array", description: "Which kinds of help to show.", items: { type: "string", enum: [...RESOURCE_KINDS], description: "One kind of help." } } },
      required: ["kinds"],
    },
  },
};

/** OpenAI-style function tools for the model (the talk tools, or the story workshop's). */
export function modelTools(names: readonly ToolName[] = MODEL_TOOLS) {
  return names.map((name) => ({ type: "function" as const, function: { name, description: TOOL_DEFS[name].description, parameters: TOOL_DEFS[name].parameters } }));
}

/** Validates one tool call by name and JSON (or object) arguments; null when it isn't allowed. */
export function parseToolCall(name: string, args: unknown, allowed: readonly ToolName[] = MODEL_TOOLS): ToolCall | null {
  if (!(allowed as readonly string[]).includes(name)) return null;
  let value = args;
  if (typeof args === "string") {
    try {
      value = JSON.parse(args || "{}");
    } catch {
      return null;
    }
  }
  const parsed = TOOL_ARGS[name as ToolName].safeParse(value);
  return parsed.success ? ({ name, args: parsed.data } as ToolCall) : null;
}

/**
 * Whether a screen tool may reach this child (checked in the proxy, from our database): a place only
 * when the child has reached it, a story only when story making is open for them now (D-070, D-076).
 */
export function allowedForChild(call: ToolCall, can: { placesOpen: readonly string[]; storiesOpen: boolean }): boolean {
  if (call.name === "suggest_place") return can.placesOpen.includes(call.args.place);
  if (call.name === "offer_activity" && call.args.activity === "story") return can.storiesOpen;
  return true;
}

/** The calm activity the child just finished, as the app reports it for the next talk: closed list only. */
export function afterActivity(value: unknown): Activity | null {
  return typeof value === "string" && (ACTIVITIES as readonly string[]).includes(value) ? (value as Activity) : null;
}
