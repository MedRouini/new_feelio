import "server-only";
import { createHash } from "node:crypto";
import config from "@/content/safety/config.json";
import { checkInput } from "../pipeline";
import { configuredClassifier } from "../classify";
import { chatJson } from "../providers/together";
import type { SafetyCtx } from "../types";
import { CHOICES, type Choice, type Slot } from "./choices";
import { vetted } from "./vetted";

// A child's own story idea (owner decision D-070: "lists + free ideas, checked"). The idea goes through
// the input check like anything a child says. Then a model turns it into a SHORT, vetted, brand-style
// description (no people, no known characters, nothing scary), which is checked again. Only that
// description, never the child's words, reaches the story writer or the picture model (SR-19).
// Anything that can't be made safe is declined kindly and the child picks from the pictures instead.

export type IdeaResult =
  | { ok: true; choice: Choice }
  | { ok: false; reason: "unsafe" | "not_possible" | "unavailable"; crisis?: boolean };

const KIND: Record<Exclude<Slot, "feeling">, string> = {
  hero: "the hero of the story: an animal, a friendly creature or a toy-like object. Never a person, never a known character from films, games or books.",
  place: "where the story happens: a cheerful place in nature, in the sky, under the sea or in a cosy home. Never a real named place, school or address.",
  adventure: "what happens in the story: a small, everyday or playful event. Nothing dangerous, violent, scary in detail or adult.",
};

const SYSTEM = `You help a children's app (ages 5-12) turn a child's story idea into a safe, simple story ingredient.
You get the idea (it may come from speech recognition) and which ingredient it is for.
Return:
- ok: false if it cannot be made into a kind, safe, age-appropriate ingredient of that type (for example a real person, a known character, a weapon, something scary, unkind or adult). Otherwise true.
- label_en: 2 to 5 simple English words a young child understands ("a rainbow unicorn").
- label_ar: the same in simple Modern Standard Arabic.
- describe: 6 to 18 English words describing it for a picture in a soft, cute picture-book style. Only animals, creatures, plants, objects and places. Never people, never body details beyond simple colours and shapes, never text or letters, never brand or character names.
If it is close to something safe, adapt it gently (a known character becomes a similar generic animal or creature).`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ok: { type: "boolean" },
    label_en: { type: "string" },
    label_ar: { type: "string" },
    describe: { type: "string" },
  },
  required: ["ok", "label_en", "label_ar", "describe"],
};

export async function mapIdea(ctx: SafetyCtx, slot: Exclude<Slot, "feeling">, said: string): Promise<IdeaResult> {
  const text = said.trim().slice(0, 200);
  if (!text) return { ok: false, reason: "not_possible" };
  const classifier = await configuredClassifier();
  const input = await checkInput({ ...ctx, feature: "story" }, text, classifier);
  if (input.degraded) return { ok: false, reason: "unavailable" };
  if (input.action.type === "crisis") return { ok: false, reason: "unsafe", crisis: true };
  if (input.action.type !== "allow" && input.action.type !== "steer") return { ok: false, reason: "unsafe" };

  let value: { ok: boolean; label_en: string; label_ar: string; describe: string };
  try {
    ({ value } = await chatJson<typeof value>({
      model: config.stories.ideas.model,
      messages: [
        { role: "system", content: SYSTEM },
        // The redacted words only (no personal information reaches the model).
        { role: "user", content: `Ingredient: ${KIND[slot]}\nThe child's idea: ${input.redacted}` },
      ],
      schema: SCHEMA,
      maxTokens: config.stories.ideas.maxTokens,
      timeoutMs: config.stories.ideas.timeoutMs,
    }));
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  const labelEn = value.label_en.trim().slice(0, 60);
  const labelAr = value.label_ar.trim().slice(0, 60);
  const describe = value.describe.trim().slice(0, 200);
  if (!value.ok || !labelEn || !describe) return { ok: false, reason: "not_possible" };

  // Everything the child will hear and every word the models will see is checked again.
  const checks = await Promise.all([vetted(ctx, labelEn, "description"), vetted(ctx, labelAr, "description"), vetted(ctx, describe, "scene")]);
  if (checks.some((ok) => !ok)) return { ok: false, reason: "not_possible" };

  const id = `idea:${createHash("sha256").update(`${slot}|${describe}`).digest("hex").slice(0, 12)}`;
  return { ok: true, choice: { id, en: labelEn, ar: labelAr, describe } };
}

/** A list choice by id, or null. (Checked ideas are carried by the session, not looked up here.) */
export function listChoice(slot: Slot, id: string): Choice | null {
  return CHOICES[slot].find((c) => c.id === id) ?? null;
}
