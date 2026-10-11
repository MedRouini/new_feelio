import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/platform/db/client";
import { childProfile, childSettings, household, usageLedger, type ScheduleWindow } from "@/platform/db/schema";
import { lastLocalDays, localDay, safeZone, scheduleStatus } from "@/platform/time";

// Screen time and allowed hours, enforced on the server (CR-2, SPEC §5.4, D-045, D-065). The child app
// sends a heartbeat once a minute while a child screen is visible; the server adds at most HEARTBEAT_S
// per HEARTBEAT_MIN_GAP_S, so a client cannot speed time up, and it alone decides whether the child
// may play now. Days and hours are the family's own, in their time zone (platform/time.ts, Luxon).

export const HEARTBEAT_S = 60;
const HEARTBEAT_MIN_GAP_S = 50;
const FEATURE = "app";

/** Why the child can't play right now (null: they can). */
export type Pause = null | { reason: "time_up" } | { reason: "outside_hours"; nextAt: Date | null; sameDay: boolean; zone: string };

type Limits = { zone: string; dailyMinutes: number; schedule: ScheduleWindow[] };

async function limitsOf(childId: string): Promise<Limits> {
  const [r] = await db
    .select({ zone: household.timezone, dailyMinutes: childSettings.dailyMinutes, schedule: childSettings.schedule })
    .from(childProfile)
    .innerJoin(household, eq(household.id, childProfile.householdId))
    .leftJoin(childSettings, eq(childSettings.childId, childProfile.id))
    .where(eq(childProfile.id, childId))
    .limit(1);
  return { zone: safeZone(r?.zone), dailyMinutes: r?.dailyMinutes ?? 30, schedule: r?.schedule ?? [] };
}

async function secondsOn(childId: string, days: string[]): Promise<Record<string, number>> {
  const rows = await db
    .select({ day: usageLedger.day, s: sql<number>`coalesce(sum(${usageLedger.seconds}), 0)::int` })
    .from(usageLedger)
    .where(and(eq(usageLedger.childId, childId), inArray(usageLedger.day, days), eq(usageLedger.feature, FEATURE)))
    .groupBy(usageLedger.day);
  return Object.fromEntries(days.map((d) => [d, rows.find((r) => r.day === d)?.s ?? 0]));
}

/** Seconds used on the family's current day. */
export async function secondsToday(childId: string, now = new Date()): Promise<number> {
  const { zone } = await limitsOf(childId);
  const day = localDay(now, zone);
  return (await secondsOn(childId, [day]))[day];
}

function pauseOf(l: Limits, usedToday: number, now: Date): Pause {
  const hours = scheduleStatus(now, l.zone, l.schedule);
  if (!hours.allowed) return { reason: "outside_hours", nextAt: hours.next?.at ?? null, sameDay: hours.next?.sameDay ?? false, zone: l.zone };
  if (usedToday >= l.dailyMinutes * 60) return { reason: "time_up" };
  return null;
}

/** Whether the child may play now, decided on the server: allowed hours first, then today's minutes. */
export async function pauseFor(childId: string, now = new Date()): Promise<Pause> {
  const l = await limitsOf(childId);
  const day = localDay(now, l.zone);
  return pauseOf(l, (await secondsOn(childId, [day]))[day], now);
}

/** Records one heartbeat (when the child may play and enough time has passed) and returns whether they're paused now. */
export async function recordHeartbeat(child: { childId: string; householdId: string }, now = new Date()): Promise<{ timeUp: boolean }> {
  const l = await limitsOf(child.childId);
  const day = localDay(now, l.zone);
  const used = (await secondsOn(child.childId, [day]))[day];
  if (pauseOf(l, used, now)) return { timeUp: true };
  const [last] = await db
    .select({ at: usageLedger.createdAt })
    .from(usageLedger)
    .where(and(eq(usageLedger.childId, child.childId), eq(usageLedger.feature, FEATURE)))
    .orderBy(desc(usageLedger.createdAt))
    .limit(1);
  const gapOk = !last || (now.getTime() - last.at.getTime()) / 1000 >= HEARTBEAT_MIN_GAP_S;
  if (!gapOk) return { timeUp: false };
  await db.insert(usageLedger).values({ childId: child.childId, householdId: child.householdId, day, feature: FEATURE, seconds: HEARTBEAT_S, createdAt: now });
  return { timeUp: pauseOf(l, used + HEARTBEAT_S, now) !== null };
}

/** Minutes used on each of the family's last 7 days (oldest first), for the parent dashboard. */
export async function weekUsage(childId: string, now = new Date()): Promise<{ day: string; minutes: number }[]> {
  const { zone } = await limitsOf(childId);
  const days = lastLocalDays(now, zone, 7);
  const secs = await secondsOn(childId, days);
  return days.map((day) => ({ day, minutes: Math.round(secs[day] / 60) }));
}
