import "server-only";
import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { db } from "@/platform/db/client";
import { decryptField } from "@/platform/crypto";
import { env } from "@/platform/env";
import { parentReport, safetyEvent, safetyEventCount } from "@/platform/db/schema";

// The safety lead's review queue (SR-40, SAFETY_POLICY §5, D-066). Only user ids listed in
// SAFETY_LEAD_USER_IDS may use it, after a fresh password check. It shows restricted events (never
// shown to the account holder) and decrypted, redacted excerpts while they exist (30 days).

export function isSafetyLead(userId: string, list: string | undefined = env().SAFETY_LEAD_USER_IDS): boolean {
  const ids = (list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(userId);
}

export async function reviewQueue(now = new Date()) {
  const events = await db
    .select()
    .from(safetyEvent)
    .where(and(isNull(safetyEvent.reviewedAt), or(eq(safetyEvent.restricted, true), eq(safetyEvent.level, "high"), eq(safetyEvent.level, "medium"))))
    .orderBy(desc(safetyEvent.createdAt))
    .limit(100);
  const reports = await db.select().from(parentReport).where(isNull(parentReport.reviewedAt)).orderBy(desc(parentReport.createdAt)).limit(100);
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const counts = await db
    .select({ category: safetyEventCount.category, total: sql<number>`sum(${safetyEventCount.count})::int` })
    .from(safetyEventCount)
    .where(and(gte(safetyEventCount.day, since), sql`${safetyEventCount.feature} <> 'test'`))
    .groupBy(safetyEventCount.category)
    .orderBy(desc(sql`sum(${safetyEventCount.count})`));
  return {
    events: events.map(({ excerptEnc, ...e }) => ({ ...e, excerpt: excerptEnc ? decryptField(excerptEnc) : null })),
    reports: reports.map(({ noteEnc, ...r }) => ({ ...r, note: noteEnc ? decryptField(noteEnc) : null })),
    counts,
  };
}

export async function reviewEvent(id: string, by: string, opts: { escalate?: boolean } = {}) {
  await db
    .update(safetyEvent)
    .set({ reviewedAt: new Date(), reviewedBy: by, ...(opts.escalate !== undefined ? { escalated: opts.escalate } : {}) })
    .where(eq(safetyEvent.id, id));
}

export async function reviewReport(id: string, by: string) {
  await db.update(parentReport).set({ reviewedAt: new Date(), reviewedBy: by }).where(eq(parentReport.id, id));
}
