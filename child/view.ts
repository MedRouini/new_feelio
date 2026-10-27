import "server-only";
import { eq } from "drizzle-orm";
import type { ChildContext } from "@/auth/guards";
import { db } from "@/platform/db/client";
import { childProfile, childSettings } from "@/platform/db/schema";
import { decryptField } from "@/platform/crypto";
import type { WorldState } from "@/world/unlock";
import { getWorldState } from "./progress";
import { pauseFor, type Pause } from "./usage";
import {
  DEFAULT_AVATAR,
  ONBOARDING_STEPS,
  avatarSchema,
  nicknameWord,
  type Avatar,
  type Interest,
  type OnboardingUpdate,
} from "./options";

// What the child app may know about its own child (child scope). Server-only.

export type ChildView = {
  locale: "en" | "ar";
  ageBand: "5-6" | "7-9" | "10-12";
  /** The name the child chose (a list word, or the parent's nickname); null if none chosen. */
  name: string | null;
  hasParentNickname: boolean;
  /** The nickname the parent typed (decrypted, this child only), offered as a name choice. */
  parentNickname: string | null;
  nicknameChoice: string | null;
  avatar: Avatar;
  avatarChosen: boolean;
  interests: Interest[];
  onboarding: { step: number; done: boolean };
  features: { talk: boolean; stories: boolean; scenarios: boolean };
  sound: boolean;
  /** The child can't play right now: outside allowed hours or today's time used up (server-decided). */
  timeUp: boolean;
  pause: Pause;
  world: WorldState;
};

export async function getChildView(child: ChildContext): Promise<ChildView | null> {
  const [p] = await db.select().from(childProfile).where(eq(childProfile.id, child.childId)).limit(1);
  if (!p) return null;
  const [s] = await db.select().from(childSettings).where(eq(childSettings.childId, child.childId)).limit(1);
  const parentNick = p.nicknameEnc ? decryptField(p.nicknameEnc) : null;
  const avatar = avatarSchema.safeParse(p.avatar);
  const name = p.nicknameKey === "parent" ? parentNick : nicknameWord(p.nicknameKey, p.locale) ?? null;
  const pause = await pauseFor(child.childId);
  const step = Math.min(p.onboarding?.step ?? 0, ONBOARDING_STEPS);

  return {
    locale: p.locale,
    ageBand: p.ageBand,
    name,
    hasParentNickname: Boolean(parentNick),
    parentNickname: parentNick,
    nicknameChoice: p.nicknameKey,
    avatar: avatar.success ? avatar.data : DEFAULT_AVATAR,
    avatarChosen: avatar.success,
    interests: (p.interests ?? []) as Interest[],
    onboarding: { step, done: Boolean(p.onboarding?.completedAt) },
    features: s?.features ?? { talk: false, stories: false, scenarios: false },
    sound: s?.sound ?? true,
    timeUp: pause !== null,
    pause,
    world: await getWorldState(child.childId),
  };
}

/** Applies a validated onboarding update for this child only. Step never goes backwards. */
export async function applyOnboardingUpdate(child: ChildContext, u: OnboardingUpdate): Promise<void> {
  const [p] = await db.select().from(childProfile).where(eq(childProfile.id, child.childId)).limit(1);
  if (!p) throw new Error("child not found");
  if (u.nickname === "parent" && !p.nicknameEnc) throw new Error("no parent nickname");

  const skip = u.skip === true;
  const step = skip ? ONBOARDING_STEPS : Math.max(p.onboarding?.step ?? 0, u.step);
  const finished = step >= ONBOARDING_STEPS;
  await db
    .update(childProfile)
    .set({
      // Worn items are kept as they are: only My room's route (which checks unlocks) changes them.
      ...(u.avatar || (skip && !p.avatar) ? { avatar: { ...(u.avatar ?? DEFAULT_AVATAR), ...(p.avatar?.wear ? { wear: p.avatar.wear } : {}) } } : {}),
      ...(u.nickname ? { nicknameKey: u.nickname } : {}),
      ...(u.interests ? { interests: u.interests } : {}),
      onboarding: {
        step,
        ...(finished ? { completedAt: p.onboarding?.completedAt ?? new Date().toISOString() } : {}),
        ...(skip || p.onboarding?.skipped ? { skipped: true } : {}),
      },
    })
    .where(eq(childProfile.id, child.childId));
}
