import { z } from "zod";
import { WORLD_PLACE_IDS } from "@/design/asset-ids";

// The voice companion's client tools (ARCHITECTURE §4.2, MASCOT.md, D-068): the one contract shared by
// the agent sync script (what ElevenLabs knows), the safety proxy (what it may emit) and the Talk screen
// (what it shows). Every tool only changes what the child's screen shows; none reaches the network,
// stores anything or acts on its own. Arguments are closed lists, validated on both sides.

export const MASCOT_MOODS = ["happy", "excited", "empathy", "calm"] as const;
export const FEELINGS = ["happy", "sad", "angry", "excited"] as const;
export const RESOURCE_KINDS = ["trusted_adult", "emergency_number", "child_helpline", "crisis_line", "report_exploitation"] as const;

export const TOOL_ARGS = {
  set_mascot_state: z.strictObject({ mood: z.enum(MASCOT_MOODS) }),
  show_feeling_card: z.strictObject({ feeling: z.enum(FEELINGS) }),
  start_breathing: z.strictObject({ rounds: z.number().int().min(1).max(3) }),
  suggest_place: z.strictObject({ place: z.enum(WORLD_PLACE_IDS) }),
  show_safety_resources: z.strictObject({ kinds: z.array(z.enum(RESOURCE_KINDS)).min(1).max(RESOURCE_KINDS.length) }),
} as const;

export type ToolName = keyof typeof TOOL_ARGS;
export type ToolCall = { [K in ToolName]: { name: K; args: z.infer<(typeof TOOL_ARGS)[K]> } }[ToolName];

/** Tools the model may choose. `show_safety_resources` is never offered: only the router emits it (crisis). */
export const MODEL_TOOLS = ["set_mascot_state", "show_feeling_card", "start_breathing", "suggest_place"] as const satisfies readonly ToolName[];

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
  start_breathing: {
    description: "Starts a short, calm breathing game on the child's screen (breathe in, breathe out). Offer it when the child feels upset, worried or angry, and only if they say yes.",
    parameters: {
      type: "object",
      properties: { rounds: { type: "integer", minimum: 1, maximum: 3, description: "How many slow breaths, 1 to 3." } },
      required: ["rounds"],
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
  show_safety_resources: {
    description: "Shows the child who can help them (trusted grown-ups, emergency help). Only the safety layer uses this.",
    parameters: {
      type: "object",
      properties: { kinds: { type: "array", description: "Which kinds of help to show.", items: { type: "string", enum: [...RESOURCE_KINDS], description: "One kind of help." } } },
      required: ["kinds"],
    },
  },
};

/** OpenAI-style function tools for the model (only MODEL_TOOLS). */
export function modelTools() {
  return MODEL_TOOLS.map((name) => ({ type: "function" as const, function: { name, description: TOOL_DEFS[name].description, parameters: TOOL_DEFS[name].parameters } }));
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
