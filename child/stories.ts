import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { ChildContext } from "@/auth/guards";
import { db } from "@/platform/db/client";
import { childProfile, childSettings, household, story, storyDraft, storyNarration, usageLedger, type StoryChoices, type StoryPicture } from "@/platform/db/schema";
import { env } from "@/platform/env";
import { deletePrefix, getFile, putFile, storageConfigured } from "@/platform/storage";
import { localDay, safeZone } from "@/platform/time";
import { IMAGE_PROMPT_VERSION, makePicture } from "@/safety/images";
import { SLOTS, choice, type Choice, type Slot } from "@/safety/stories/choices";
import { STORY_PROMPT_VERSION, writeStory } from "@/safety/stories/write";
import { narrate, narrationVoice } from "@/safety/voice-lines/tts";
import config from "@/content/safety/config.json";
import { pauseFor } from "./usage";

// Stories, child scope, server-only (SPEC §5.2, docs/STORIES.md, D-070). Every check is here, on the
// server (CR-2): the parent allows Stories, allowed hours and time left, the global switch, and a daily
// cap of new stories per child (cost discipline, CR-11). The workshop's slots live on the server: the
// story is made from them, never from anything the client sends.

/** New stories per child per family day (about $0.10 of pictures each). */
export const STORY_DAILY_CAP = 3;
/** Picture 0 is the cover, 1..4 the pages. */
export const PICTURES = 5;
/** A picture "drawing" for longer than this is considered lost and may be tried again. */
const DRAWING_STALE_MS = 90_000;

export type StoryRefusal = "off" | "stories_off" | "time_up" | "outside_hours" | "daily_cap" | "incomplete" | "unavailable";

const path = (childId: string, storyId: string, file: string) => `stories/${childId}/${storyId}/${file}`;

async function zoneOf(childId: string): Promise<string> {
  const [r] = await db.select({ zone: household.timezone }).from(childProfile).innerJoin(household, eq(household.id, childProfile.householdId)).where(eq(childProfile.id, childId)).limit(1);
  return safeZone(r?.zone);
}

/** Why this child can't make a story right now (null: they can). */
export async function storyGate(childId: string, now = new Date()): Promise<StoryRefusal | null> {
  if (!env().STORIES_ENABLED || !storageConfigured()) return "off";
  const [s] = await db.select({ features: childSettings.features }).from(childSettings).where(eq(childSettings.childId, childId)).limit(1);
  if (!s?.features.stories) return "stories_off";
  const pause = await pauseFor(childId, now);
  if (pause) return pause.reason;
  if ((await storiesToday(childId, now)) >= STORY_DAILY_CAP) return "daily_cap";
  return null;
}

export async function storiesToday(childId: string, now = new Date()): Promise<number> {
  const zone = await zoneOf(childId);
  const today = localDay(now, zone);
  const recent = await db.select({ at: story.createdAt }).from(story).where(and(eq(story.childId, childId), gte(story.createdAt, new Date(now.getTime() - 36 * 3600_000))));
  return recent.filter((r) => localDay(r.at, zone) === today).length;
}

// ---------- the workshop's slots ----------

export async function getDraft(childId: string): Promise<Partial<StoryChoices>> {
  const [d] = await db.select().from(storyDraft).where(eq(storyDraft.childId, childId)).limit(1);
  return d?.choices ?? {};
}

/** Sets one slot: a list id (from a tap or the voice tool), or a checked idea (server only, ideas.ts). */
export async function setDraftChoice(childId: string, slot: Slot, value: Choice): Promise<Partial<StoryChoices>> {
  const choices = { ...(await getDraft(childId)), [slot]: value };
  await db
    .insert(storyDraft)
    .values({ childId, choices, updatedAt: new Date() })
    .onConflictDoUpdate({ target: storyDraft.childId, set: { choices, updatedAt: new Date() } });
  return choices;
}

export async function setDraftListChoice(childId: string, slot: Slot, id: string): Promise<Partial<StoryChoices> | null> {
  const c = choice(slot, id);
  return c ? setDraftChoice(childId, slot, c) : null;
}

export async function clearDraft(childId: string): Promise<void> {
  await db.delete(storyDraft).where(eq(storyDraft.childId, childId));
}

function complete(d: Partial<StoryChoices>): d is StoryChoices {
  return SLOTS.every((s) => d[s]);
}

// ---------- making a story ----------

export async function createStory(child: ChildContext, now = new Date()): Promise<{ ok: true; id: string } | { ok: false; reason: StoryRefusal }> {
  const refusal = await storyGate(child.childId, now);
  if (refusal) return { ok: false, reason: refusal };
  const draft = await getDraft(child.childId);
  if (!complete(draft)) return { ok: false, reason: "incomplete" };

  const ctx = { childId: child.childId, householdId: child.householdId, ageBand: child.ageBand, locale: child.locale, feature: "story" as const, market: env().DEFAULT_MARKET };
  const written = await writeStory(ctx, draft);
  const pictures: StoryPicture[] = Array.from({ length: PICTURES }, () => ({ state: "waiting" }));
  const [row] = await db
    .insert(story)
    .values({
      childId: child.childId,
      householdId: child.householdId,
      locale: child.locale,
      ageBand: child.ageBand,
      choices: draft,
      content: { title: written.title, heroLook: written.heroLook, pages: written.pages, question: written.question },
      source: written.source,
      pictures,
      seed: Math.floor(Math.random() * 1_000_000),
      versions: { story: STORY_PROMPT_VERSION, image: IMAGE_PROMPT_VERSION, writer: config.stories.writer.model, images: config.images.generator.model, checker: config.images.checker.model },
    })
    .returning({ id: story.id });
  await clearDraft(child.childId);
  return { ok: true, id: row.id };
}

type Row = typeof story.$inferSelect;

async function own(childId: string, storyId: string): Promise<Row | null> {
  const [r] = await db.select().from(story).where(and(eq(story.id, storyId), eq(story.childId, childId))).limit(1);
  return r ?? null;
}

async function setPicture(storyId: string, n: number, p: StoryPicture, referenceUrl?: string) {
  const [r] = await db.select({ pictures: story.pictures }).from(story).where(eq(story.id, storyId)).limit(1);
  if (!r) return;
  const pictures = [...r.pictures];
  pictures[n] = p;
  await db.update(story).set({ pictures, ...(referenceUrl ? { referenceUrl } : {}) }).where(eq(story.id, storyId));
}

/**
 * Draws picture n of this child's story (0 = the cover, a portrait of the hero; 1..4 the pages, drawn
 * from the same character description and seed). Idempotent: a finished picture is not drawn again.
 * Each call is one short request.
 */
export async function drawPicture(childId: string, storyId: string, n: number): Promise<{ ok: true; state: StoryPicture["state"] } | { ok: false; reason: "not_found" | "wait" | "busy" | "unavailable" }> {
  if (!Number.isInteger(n) || n < 0 || n >= PICTURES) return { ok: false, reason: "not_found" };
  const s = await own(childId, storyId);
  if (!s) return { ok: false, reason: "not_found" };
  const current = s.pictures[n];
  if (current.state === "ready" || current.state === "fallback") return { ok: true, state: current.state };
  if (current.state === "drawing" && current.at && Date.now() - Date.parse(current.at) < DRAWING_STALE_MS) return { ok: false, reason: "busy" };

  await setPicture(storyId, n, { state: "drawing", at: new Date().toISOString() });
  const content = s.content;
  const pic = await makePicture({
    heroLook: content.heroLook,
    scene: n === 0 ? s.choices.place.describe : content.pages[n - 1].scene,
    kind: n === 0 ? "cover" : "page",
    // Pages are drawn from the character description and the story's own seed: a reference picture made
    // FLUX.2 copy the cover's whole scene onto every page (tested 2026-10-11, D-070).
    reference: undefined,
    seed: s.seed,
  });
  if (!pic.ok && pic.reason === "unavailable") {
    // The provider is down or not permitted: leave it waiting, so the next visit tries again.
    await setPicture(storyId, n, { state: "waiting" });
    return { ok: false, reason: "unavailable" };
  }
  if (!pic.ok) {
    await setPicture(storyId, n, { state: "fallback" });
    return { ok: true, state: "fallback" };
  }
  await putFile(path(childId, storyId, `${n}.jpg`), pic.bytes, pic.contentType);
  await setPicture(storyId, n, { state: "ready" }, n === 0 ? pic.url : undefined);
  return { ok: true, state: "ready" };
}

export async function pictureFile(childId: string, storyId: string, n: number) {
  const s = await own(childId, storyId);
  if (!s || s.pictures[n]?.state !== "ready") return null;
  return getFile(path(childId, storyId, `${n}.jpg`));
}

// ---------- the bookshelf ----------

export type ShelfBook = { id: string; title: string; coverReady: boolean; createdAt: Date; read: boolean };

export async function bookshelf(childId: string): Promise<ShelfBook[]> {
  const rows = await db.select().from(story).where(eq(story.childId, childId)).orderBy(desc(story.createdAt)).limit(60);
  return rows.map((r) => ({ id: r.id, title: r.content.title, coverReady: r.pictures[0]?.state === "ready", createdAt: r.createdAt, read: !!r.readAt }));
}

export type Book = {
  id: string;
  locale: "en" | "ar";
  title: string;
  pages: { text: string; feelio: string; picture: StoryPicture["state"] }[];
  cover: StoryPicture["state"];
  question: { text: string; answers: string[] };
  hero: { en: string; ar: string };
};

export async function openBook(childId: string, storyId: string): Promise<Book | null> {
  const s = await own(childId, storyId);
  if (!s) return null;
  if (!s.readAt) await db.update(story).set({ readAt: new Date() }).where(eq(story.id, s.id));
  return {
    id: s.id,
    locale: s.locale,
    title: s.content.title,
    cover: s.pictures[0].state,
    pages: s.content.pages.map((p, i) => ({ text: p.text, feelio: p.feelio, picture: s.pictures[i + 1].state })),
    question: s.content.question,
    hero: { en: s.choices.hero.en, ar: s.choices.hero.ar },
  };
}

// ---------- deletion (parents; kept until a parent deletes, owner decision 2026-10-11) ----------

export async function deleteStory(householdId: string, storyId: string): Promise<boolean> {
  const [s] = await db.select({ childId: story.childId }).from(story).where(and(eq(story.id, storyId), eq(story.householdId, householdId))).limit(1);
  if (!s) return false;
  await deletePrefix(`stories/${s.childId}/${storyId}/`);
  await db.delete(story).where(eq(story.id, storyId));
  return true;
}

/** Called before a profile or an account is deleted: the rows cascade, the files are removed here. */
export async function deleteChildStoryFiles(childId: string): Promise<number> {
  return deletePrefix(`stories/${childId}/`);
}

export const _test = { path };

// ---------- narration ("Read it to me", opt-in; D-070) ----------

/** New narrated stories per child per family day (owner decision 2026-10-11). Replays are free. */
export const NARRATION_DAILY_CAP = 1;

export type NarrationRefusal = "not_found" | "no_voice" | "off" | "cap" | "unavailable";

export async function narrationFile(child: ChildContext, storyId: string, page: number, now = new Date()): Promise<{ ok: true; file: { stream: ReadableStream<Uint8Array>; contentType: string } } | { ok: false; reason: NarrationRefusal }> {
  if (!Number.isInteger(page) || page < 1 || page > 4) return { ok: false, reason: "not_found" };
  const s = await own(child.childId, storyId);
  if (!s) return { ok: false, reason: "not_found" };
  if (!narrationVoice(s.locale)) return { ok: false, reason: "no_voice" };
  const file = path(child.childId, storyId, `narration-${page}.mp3`);
  const cached = await getFile(file);
  if (cached) return { ok: true, file: cached };
  // Making new audio spends credits: the global voice switch and the daily cap apply (CR-11).
  if (!env().VOICE_ENABLED) return { ok: false, reason: "off" };
  const [row] = await db.select().from(storyNarration).where(eq(storyNarration.storyId, storyId)).limit(1);
  if (!row) {
    const zone = await zoneOf(child.childId);
    const today = localDay(now, zone);
    const todays = await db.select({ id: storyNarration.storyId }).from(storyNarration).where(and(eq(storyNarration.childId, child.childId), eq(storyNarration.day, today)));
    if (todays.length >= NARRATION_DAILY_CAP) return { ok: false, reason: "cap" };
    await db.insert(storyNarration).values({ storyId, childId: child.childId, day: today }).onConflictDoNothing();
  }
  const text = s.content.pages[page - 1].text;
  let audio: Buffer;
  try {
    audio = await narrate(text, s.locale);
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  await putFile(file, audio, "audio/mpeg");
  await db.update(storyNarration).set({ pages: sql`${storyNarration.pages} + 1` }).where(eq(storyNarration.storyId, storyId));
  await db.insert(usageLedger).values({ childId: child.childId, householdId: child.householdId, day: localDay(now, await zoneOf(child.childId)), feature: "narration", seconds: 0, creditsEst: text.length });
  const fresh = await getFile(file);
  return fresh ? { ok: true, file: fresh } : { ok: false, reason: "unavailable" };
}

/** A child's stories for the parent dashboard: titles, dates and themes only (D-070, SPEC §5.4 insights). */
export async function parentStories(householdId: string, childId: string) {
  const rows = await db
    .select({ id: story.id, content: story.content, choices: story.choices, createdAt: story.createdAt, locale: story.locale })
    .from(story)
    .where(and(eq(story.childId, childId), eq(story.householdId, householdId)))
    .orderBy(desc(story.createdAt))
    .limit(100);
  return rows.map((r) => ({ id: r.id, title: r.content.title, createdAt: r.createdAt, hero: r.choices.hero, feeling: r.choices.feeling }));
}
