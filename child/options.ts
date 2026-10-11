import { z } from "zod";
import nicknames from "@/content/nicknames.json";
import { AVATAR_COLOURS, AVATAR_SHAPES } from "@/design/asset-ids";

// Fixed vocabularies for onboarding (ONBOARDING.md). Shared by the client UI and the server validator,
// so nothing outside these lists can ever be stored. Nothing here is personal data.

export const COMPANIONS = ["heart", "cloud", "star"] as const;
export const INTERESTS = ["animals", "space", "music", "drawing", "ballgames", "nature", "blocks", "sea"] as const;
export const MAX_INTERESTS = 3;
export const ONBOARDING_STEPS = 6; // hello, character, name, likes, mic, gate (D-069); step = number of stops finished

export type Companion = (typeof COMPANIONS)[number];
export type Interest = (typeof INTERESTS)[number];

export const NICKNAMES: { key: string; en: string; ar: string }[] = nicknames.names;
export const NICKNAME_KEYS = NICKNAMES.map((n) => n.key);

export const avatarSchema = z.object({
  v: z.literal(1),
  shape: z.enum(AVATAR_SHAPES),
  colour: z.enum(AVATAR_COLOURS),
  companion: z.enum(COMPANIONS),
});
export type Avatar = z.infer<typeof avatarSchema>;
export const DEFAULT_AVATAR: Avatar = { v: 1, shape: "bun", colour: "amber", companion: "star" };

/** One onboarding update from the child device. Every field is optional; values must be in the lists. */
export const onboardingUpdateSchema = z
  .object({
    step: z.number().int().min(0).max(ONBOARDING_STEPS),
    avatar: avatarSchema.optional(),
    /** A key from the nickname list, or "parent" to use the nickname the parent typed. */
    nickname: z.union([z.enum(NICKNAME_KEYS as [string, ...string[]]), z.literal("parent")]).optional(),
    interests: z.array(z.enum(INTERESTS)).max(MAX_INTERESTS).optional(),
    skip: z.boolean().optional(),
  })
  .strict();
export type OnboardingUpdate = z.infer<typeof onboardingUpdateSchema>;

export function nicknameWord(key: string | null | undefined, locale: "en" | "ar"): string | null {
  const n = NICKNAMES.find((x) => x.key === key);
  return n ? n[locale] : null;
}
