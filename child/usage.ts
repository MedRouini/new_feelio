import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/platform/db/client";
import { childSettings, usageLedger } from "@/platform/db/schema";

// Daily screen time, enforced on the server (CR-2, SPEC §5.4). The child app sends a heartbeat once a
// minute while a child screen is visible; the server adds at most HEARTBEAT_S per HEARTBEAT_MIN_GAP_S,
// so a client cannot speed time up, and it decides alone whether today's time is used up.
// Day boundaries are UTC for now (household timezones arrive with the schedule settings, Milestone 3).

export const HEARTBEAT_S = 60;
const HEARTBEAT_MIN_GAP_S = 50;
const FEATURE = "app";

export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function secondsToday(childId: string, now = new Date()): Promise<number> {
  const [r] = await db
    .select({ s: sql<number>`coalesce(sum(${usageLedger.seconds}), 0)::int` })
    .from(usageLedger)
    .where(and(eq(usageLedger.childId, childId), eq(usageLedger.day, today(now)), eq(usageLedger.feature, FEATURE)));
  return r?.s ?? 0;
}

export async function dailyLimitMinutes(childId: string): Promise<number> {
  const [s] = await db.select({ m: childSettings.dailyMinutes }).from(childSettings).where(eq(childSettings.childId, childId)).limit(1);
  return s?.m ?? 30;
}

export async function isTimeUp(childId: string, now = new Date()): Promise<boolean> {
  const [used, limit] = await Promise.all([secondsToday(childId, now), dailyLimitMinutes(childId)]);
  return used >= limit * 60;
}

/** Records one heartbeat (if enough time has passed since the last one) and returns whether time is up. */
export async function recordHeartbeat(child: { childId: string; householdId: string }, now = new Date()): Promise<{ timeUp: boolean }> {
  const [last] = await db
    .select({ at: usageLedger.createdAt })
    .from(usageLedger)
    .where(and(eq(usageLedger.childId, child.childId), eq(usageLedger.feature, FEATURE)))
    .orderBy(desc(usageLedger.createdAt))
    .limit(1);
  const gapOk = !last || (now.getTime() - last.at.getTime()) / 1000 >= HEARTBEAT_MIN_GAP_S;
  if (gapOk && !(await isTimeUp(child.childId, now))) {
    await db.insert(usageLedger).values({
      childId: child.childId,
      householdId: child.householdId,
      day: today(now),
      feature: FEATURE,
      seconds: HEARTBEAT_S,
      createdAt: now,
    });
  }
  return { timeUp: await isTimeUp(child.childId, now) };
}
