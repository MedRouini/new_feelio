import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/platform/db/client";
import { story } from "@/platform/db/schema";
import { CHOICES } from "@/safety/stories/choices";
import { loadWorld } from "@/world/load";
import type { WorldState } from "@/world/unlock";

// My collection (redesign v2, D-071), child scope, server-only: what the child has gathered, all of it
// already stored for other features (no new data is kept for the collection, CR-6).
// - stars: one per completed level, grouped by place, with an empty spot for each level still to play
// - books: the child's own stories (only when the parent allows Stories)
// - feelings: every feeling in the story list, lit once the child has made a story about it

export type Collection = {
  places: { id: string; name: { en: string; ar: string }; levels: { id: string; title: { en: string; ar: string }; done: boolean }[] }[];
  books: { id: string; title: string; coverReady: boolean }[] | null;
  feelings: { id: string; en: string; ar: string; met: boolean }[];
};

export async function collection(childId: string, world: WorldState, storiesOn: boolean): Promise<Collection> {
  const places = loadWorld("base").places.map((p) => ({
    id: p.id,
    name: p.name,
    levels: p.levels.map((l) => ({ id: l.id, title: l.title, done: world.places[p.id]?.levels[l.id] === "completed" })),
  }));
  const rows = await db
    .select({ id: story.id, content: story.content, pictures: story.pictures, choices: story.choices })
    .from(story)
    .where(eq(story.childId, childId))
    .orderBy(desc(story.createdAt))
    .limit(60);
  const met = new Set(rows.map((r) => r.choices.feeling?.id).filter(Boolean));
  return {
    places,
    books: storiesOn ? rows.map((r) => ({ id: r.id, title: r.content.title, coverReady: r.pictures[0]?.state === "ready" })) : null,
    feelings: CHOICES.feeling.map((f) => ({ id: f.id, en: f.en, ar: f.ar, met: met.has(f.id) })),
  };
}
