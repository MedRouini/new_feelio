import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { getWorldState } from "@/child/progress";
import { pauseFor, weekUsage } from "@/child/usage";
import { db } from "@/platform/db/client";
import { encryptField } from "@/platform/crypto";
import { auditLog, childSettings, PARENT_REPORT_CATEGORIES, parentReport, safetyEvent } from "@/platform/db/schema";
import { redact } from "@/safety/pii";
import { loadWorld } from "@/world/load";
import { getChildInHousehold } from "./operations";

// What a parent sees about their own child (SPEC §5.4, D-066). Always scoped to the parent's household.
// Safety summaries are categories turned into plain sentences: never the conversation, never an excerpt,
// and never a restricted event (a disclosure that may involve someone at home, SAFETY_POLICY §5).

const SUMMARY_DAYS = 30;

export type SafetySummary = { id: string; at: Date; kind: string; level: "low" | "medium" | "high" };

/** The parent-facing wording key for an event (messages: parent.summary.<kind>). */
function summaryKind(category: string, actorClass: string | null): string {
  switch (category) {
    case "self_harm":
    case "suicide":
      return "selfHarm";
    case "immediate_danger":
      return "danger";
    case "abuse_disclosure":
      return actorClass === "peer" ? "bullying" : "worryOutside";
    case "grooming":
    case "sextortion":
    case "sexual_minor":
      return "onlineSafety";
    case "dependency":
      return "friends";
    default:
      return "steered";
  }
}

export async function childOverview(householdId: string, childId: string, now = new Date()) {
  const child = await getChildInHousehold(householdId, childId);
  if (!child) return null;
  const since = new Date(now.getTime() - SUMMARY_DAYS * 86_400_000);
  const [world, week, pause, [settings], events] = await Promise.all([
    getWorldState(childId),
    weekUsage(childId, now),
    pauseFor(childId, now),
    db.select({ dailyMinutes: childSettings.dailyMinutes }).from(childSettings).where(eq(childSettings.childId, childId)).limit(1),
    db
      .select({ id: safetyEvent.id, at: safetyEvent.createdAt, category: safetyEvent.category, actorClass: safetyEvent.actorClass, level: safetyEvent.level })
      .from(safetyEvent)
      .where(and(eq(safetyEvent.childId, childId), eq(safetyEvent.parentVisible, true), eq(safetyEvent.restricted, false), gte(safetyEvent.createdAt, since)))
      .orderBy(desc(safetyEvent.createdAt))
      .limit(20),
  ]);
  const places = loadWorld("base").places.map((p) => ({ id: p.id, name: p.name, ...world.places[p.id] }));
  const summaries: SafetySummary[] = events.map((e) => ({ id: e.id, at: e.at, kind: summaryKind(e.category, e.actorClass), level: e.level }));
  return { places, week, today: week.at(-1)!.minutes, dailyMinutes: settings?.dailyMinutes ?? 30, pause, summaries };
}

export type ReportCategory = (typeof PARENT_REPORT_CATEGORIES)[number];

/** A parent's "something felt wrong" report: into the safety lead's queue. The note is redacted and encrypted. */
export async function createParentReport(p: { userId: string; householdId: string; childId: string | null; category: ReportCategory; note: string }) {
  if (p.childId && !(await getChildInHousehold(p.householdId, p.childId))) throw new Error("Child not found in household");
  const note = redact(p.note.trim().slice(0, 500)).text;
  await db.batch([
    db.insert(parentReport).values({ householdId: p.householdId, childId: p.childId, category: p.category, noteEnc: note ? encryptField(note) : null }),
    db.insert(auditLog).values({ householdId: p.householdId, userId: p.userId, action: "report.created", detail: { childId: p.childId, category: p.category } }),
  ]);
}
