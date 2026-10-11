import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { ChildContext } from "@/auth/guards";
import { db } from "@/platform/db/client";
import { childSettings, progress } from "@/platform/db/schema";
import { artifactsForLevel } from "@/world/artifacts/catalog";
import { loadWorld } from "@/world/load";
import type { World, WorldLevel, WorldPlace } from "@/world/schema";
import { computeWorldState, diffUnlocks, type WorldState } from "@/world/unlock";
import { pauseFor } from "./usage";

// Level progress (D-056), child scope, server-only. One `progress` row per (level, artifact):
// "started" when the child opens it, "completed" when they finish it. A level is completed when
// every one of its artifacts is. Every write is checked here, never trusted from the client:
// the level must exist and be reachable, the artifact must belong to it, the parent must allow
// scenarios, and the child must be inside allowed hours with time left today.

const PACK = "base";

type Row = { levelId: string; scenarioId: string; status: "started" | "completed" };

async function rows(childId: string): Promise<Row[]> {
  return db
    .select({ levelId: progress.levelId, scenarioId: progress.scenarioId, status: progress.status })
    .from(progress)
    .where(and(eq(progress.childId, childId), eq(progress.packId, PACK)));
}

function summarise(world: World, all: Row[]) {
  const completedLevels: string[] = [];
  const startedLevels: string[] = [];
  const doneArtifacts = new Map<string, Set<string>>();
  for (const r of all) {
    if (r.status !== "completed") continue;
    if (!doneArtifacts.has(r.levelId)) doneArtifacts.set(r.levelId, new Set());
    doneArtifacts.get(r.levelId)!.add(r.scenarioId);
  }
  for (const place of world.places) {
    for (const level of place.levels) {
      const done = doneArtifacts.get(level.id) ?? new Set<string>();
      const needed = artifactsForLevel(level);
      // A whole-level row (scenarioId "") also counts as completed (rows from before D-056).
      const complete = done.has("") || (needed.length > 0 && needed.every((a) => done.has(a)));
      if (complete) completedLevels.push(level.id);
      else if (all.some((r) => r.levelId === level.id)) startedLevels.push(level.id);
    }
  }
  return { completedLevels, startedLevels, doneArtifacts };
}

export async function getWorldState(childId: string): Promise<WorldState> {
  const world = loadWorld(PACK);
  const s = summarise(world, await rows(childId));
  return computeWorldState(world, s.completedLevels, s.startedLevels);
}

export function findLevel(world: World, levelId: string): { place: WorldPlace; level: WorldLevel } | null {
  for (const place of world.places) {
    const level = place.levels.find((l) => l.id === levelId);
    if (level) return { place, level };
  }
  return null;
}

export type ProgressRefusal = "unknown" | "locked" | "disabled" | "time_up" | "outside_hours" | "not_in_level";

type Refused = { ok: false; reason: ProgressRefusal };
const refuse = (reason: ProgressRefusal): Refused => ({ ok: false, reason });

/** The checks every level read or write passes (the level page uses them before rendering too). */
export async function checkLevelAccess(child: ChildContext, levelId: string, artifactId?: string) {
  const world = loadWorld(PACK);
  const found = findLevel(world, levelId);
  if (!found) return refuse("unknown");
  const [settings] = await db.select({ features: childSettings.features }).from(childSettings).where(eq(childSettings.childId, child.childId)).limit(1);
  if (settings && !settings.features.scenarios) return refuse("disabled");
  const pause = await pauseFor(child.childId);
  if (pause) return refuse(pause.reason);
  const s = summarise(world, await rows(child.childId));
  const state = computeWorldState(world, s.completedLevels, s.startedLevels);
  if (state.places[found.place.id].levels[levelId] === "locked") return refuse("locked");
  const artifacts = artifactsForLevel(found.level);
  if (artifactId !== undefined && !artifacts.includes(artifactId)) return refuse("not_in_level");
  const done = s.doneArtifacts.get(levelId) ?? new Set<string>();
  return { ok: true as const, world, ...found, state, artifacts, doneArtifacts: artifacts.filter((a) => done.has(a)) };
}

/** The child opened an artifact: the level becomes "in progress" (a no-op if already recorded). */
export async function startArtifact(child: ChildContext, levelId: string, artifactId: string) {
  const access = await checkLevelAccess(child, levelId, artifactId);
  if (!access.ok) return access;
  await db
    .insert(progress)
    .values({ childId: child.childId, packId: PACK, levelId, scenarioId: artifactId, status: "started" })
    .onConflictDoNothing();
  return { ok: true as const };
}

/** The child finished an artifact. Returns what changed, so the app can show it. */
export async function completeArtifact(child: ChildContext, levelId: string, artifactId: string) {
  const access = await checkLevelAccess(child, levelId, artifactId);
  if (!access.ok) return access;
  await db
    .insert(progress)
    .values({ childId: child.childId, packId: PACK, levelId, scenarioId: artifactId, status: "completed" })
    .onConflictDoUpdate({
      target: [progress.childId, progress.packId, progress.levelId, progress.scenarioId],
      set: { status: "completed", completedAt: sql`now()` },
    });
  const after = await getWorldState(child.childId);
  const placeId = access.place.id;
  const levelCompleted = after.places[placeId].levels[levelId] === "completed";
  const done = new Set([...access.doneArtifacts, artifactId]);
  return {
    ok: true as const,
    levelCompleted,
    /** The next artifact of this level, when the level has more than one. */
    nextArtifactId: levelCompleted ? null : (access.artifacts.find((a) => !done.has(a)) ?? null),
    ...diffUnlocks(access.world, access.state, after, placeId),
    place: after.places[placeId],
  };
}

export type CompletionResult = Extract<Awaited<ReturnType<typeof completeArtifact>>, { ok: true }>;
