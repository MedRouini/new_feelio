import "server-only";
import { and, count, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/platform/db/client";
import { childProfile, story } from "@/platform/db/schema";
import { decryptField } from "@/platform/crypto";
import { AVATAR_COLOURS } from "@/design/asset-ids";
import { DEFAULT_AVATAR, INTERESTS, MAX_INTERESTS, NICKNAME_KEYS, avatarSchema, nicknameWord, type Avatar, type Interest } from "./options";
import { FREE_ITEMS, WEAR_ITEMS, WEAR_SLOTS, itemById, rewardPoints, stepsToNext, unlockedCount } from "./wardrobe";
import { collection, type Collection } from "./collection";
import { getWorldState } from "./progress";

// My room (D-074), child scope, server-only. Points come from data other features already store
// (stories, the feelings in them, finished levels); the profile keeps only the highest unlock count ever
// reached and how many unlocks were watched, so a deleted story never takes an item away (rule 12).
// Every change is checked here (CR-2): items must be unlocked and in their own body area, names come
// from the reviewed list or the parent's nickname, likes from the list.

export const roomUpdateSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("wear"), slot: z.enum(WEAR_SLOTS), item: z.enum(WEAR_ITEMS.map((i) => i.id) as [string, ...string[]]).nullable() }),
  z.strictObject({ action: z.literal("colour"), colour: z.enum(AVATAR_COLOURS) }),
  z.strictObject({ action: z.literal("nickname"), nickname: z.union([z.enum(NICKNAME_KEYS as [string, ...string[]]), z.literal("parent")]) }),
  z.strictObject({ action: z.literal("interests"), interests: z.array(z.enum(INTERESTS)).max(MAX_INTERESTS) }),
  z.strictObject({ action: z.literal("seen") }),
]);
export type RoomUpdate = z.infer<typeof roomUpdateSchema>;

export type RoomState = {
  avatar: Avatar;
  nicknameKey: string | null;
  name: string | null;
  parentNickname: string | null;
  interests: Interest[];
  points: number;
  reached: number;
  seen: number;
  stepsToNext: number | null;
  places: Collection["places"];
  feelings: Collection["feelings"];
  /** The number of the child's books, or null when the parent has Stories off. */
  books: number | null;
};

async function profile(childId: string) {
  const [p] = await db.select().from(childProfile).where(eq(childProfile.id, childId)).limit(1);
  if (!p) throw new Error("child not found");
  return p;
}

/** Points from what is stored now, and the reached count raised to match (never lowered). */
async function refresh(childId: string) {
  const world = await getWorldState(childId);
  const col = await collection(childId, world, true);
  const [{ n }] = await db.select({ n: count() }).from(story).where(eq(story.childId, childId));
  const levels = col.places.flatMap((p) => p.levels).filter((l) => l.done).length;
  const points = rewardPoints({ stories: Number(n), feelings: col.feelings.filter((f) => f.met).length, levels });
  const computed = unlockedCount(points);
  await db
    .update(childProfile)
    .set({ rewardsReached: sql`greatest(${childProfile.rewardsReached}, ${computed})` })
    .where(eq(childProfile.id, childId));
  return { points, col, stories: Number(n) };
}

export async function roomState(childId: string, storiesOn: boolean): Promise<RoomState> {
  const { points, col, stories } = await refresh(childId);
  const p = await profile(childId);
  const parsed = avatarSchema.safeParse(p.avatar);
  const avatar = parsed.success ? { ...parsed.data, wear: parsed.data.wear ?? {} } : { ...DEFAULT_AVATAR, wear: {} };
  const parentNickname = p.nicknameEnc ? decryptField(p.nicknameEnc) : null;
  const reached = Math.max(p.rewardsReached, FREE_ITEMS);
  return {
    avatar,
    nicknameKey: p.nicknameKey,
    name: p.nicknameKey === "parent" ? parentNickname : nicknameWord(p.nicknameKey, p.locale),
    parentNickname,
    interests: (p.interests ?? []) as Interest[],
    points,
    reached,
    seen: Math.min(Math.max(p.rewardsSeen, FREE_ITEMS), reached),
    stepsToNext: stepsToNext(points, reached),
    places: col.places,
    feelings: col.feelings,
    books: storiesOn ? stories : null,
  };
}

export async function applyRoomUpdate(childId: string, u: RoomUpdate): Promise<{ ok: true; opened?: string } | { ok: false }> {
  const p = await profile(childId);
  const current = avatarSchema.safeParse(p.avatar);
  const avatar: Avatar = current.success ? current.data : DEFAULT_AVATAR;
  switch (u.action) {
    case "wear": {
      const wear = { ...(avatar.wear ?? {}) };
      if (u.item === null) {
        delete wear[u.slot];
      } else {
        const item = itemById(u.item);
        await refresh(childId);
        const reached = Math.max((await profile(childId)).rewardsReached, FREE_ITEMS);
        const index = WEAR_ITEMS.findIndex((i) => i.id === u.item);
        if (!item || item.slot !== u.slot || index >= reached) return { ok: false };
        wear[u.slot] = item.id;
      }
      await db.update(childProfile).set({ avatar: { ...avatar, wear } }).where(eq(childProfile.id, childId));
      return { ok: true };
    }
    case "colour":
      await db.update(childProfile).set({ avatar: { ...avatar, colour: u.colour } }).where(eq(childProfile.id, childId));
      return { ok: true };
    case "nickname":
      if (u.nickname === "parent" && !p.nicknameEnc) return { ok: false };
      await db.update(childProfile).set({ nicknameKey: u.nickname }).where(eq(childProfile.id, childId));
      return { ok: true };
    case "interests":
      await db.update(childProfile).set({ interests: u.interests }).where(eq(childProfile.id, childId));
      return { ok: true };
    case "seen": {
      await refresh(childId);
      // One unlock per call, and never past what was reached (a double tap can't skip one).
      const rows = await db
        .update(childProfile)
        .set({ rewardsSeen: sql`greatest(${childProfile.rewardsSeen}, ${FREE_ITEMS}) + 1` })
        .where(and(eq(childProfile.id, childId), lt(sql`greatest(${childProfile.rewardsSeen}, ${FREE_ITEMS})`, childProfile.rewardsReached)))
        .returning({ seen: childProfile.rewardsSeen });
      if (!rows.length) return { ok: false };
      return { ok: true, opened: WEAR_ITEMS[rows[0].seen - 1].id };
    }
  }
}
