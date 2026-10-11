import "server-only";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/platform/db/client";
import { adultGate, apikey, auditLog, parentReport, rateLimit, safetyEvent, session, usageLedger, verification, voiceSession } from "@/platform/db/schema";

// Retention table (CR-6). Proposals awaiting owner sign-off are in docs/ARCHITECTURE.md §7.
// Safety data (SAFETY_POLICY §7, approved by the owner 2026-10-11, D-058): events 90 days, excerpts
// 30 days (crypto-shredded by deleting the ciphertext), restricted events 30 days unless escalated.
// Aggregate counts (safety_event_count) hold no child data and are kept. Parent reports: 90 days (D-066).
export const RETENTION_DAYS = {
  usageLedger: 90,
  auditLog: 365,
  adultGate: 1,
  rateLimit: 1,
  safetyEvent: 90,
  restrictedSafetyEvent: 30,
  parentReport: 90,
  voiceSession: 90,
} as const;

const DAY = 24 * 60 * 60 * 1000;
export const cutoff = (days: number, now = Date.now()) => new Date(now - days * DAY);

/** Hard-deletes everything past its retention period. Runs daily (Vercel Hobby cron limit). */
export async function runRetention(now = Date.now()) {
  const nowDate = new Date(now);
  const results = await db.batch([
    db.delete(usageLedger).where(lt(usageLedger.createdAt, cutoff(RETENTION_DAYS.usageLedger, now))).returning({ id: usageLedger.id }),
    db.delete(auditLog).where(lt(auditLog.createdAt, cutoff(RETENTION_DAYS.auditLog, now))).returning({ id: auditLog.id }),
    db.delete(adultGate).where(lt(adultGate.passedAt, cutoff(RETENTION_DAYS.adultGate, now))).returning({ id: adultGate.sessionId }),
    db.delete(session).where(lt(session.expiresAt, nowDate)).returning({ id: session.id }),
    db.delete(verification).where(lt(verification.expiresAt, nowDate)).returning({ id: verification.id }),
    db.delete(apikey).where(and(isNotNull(apikey.expiresAt), lt(apikey.expiresAt, nowDate))).returning({ id: apikey.id }),
    db.delete(apikey).where(eq(apikey.enabled, false)).returning({ id: apikey.id }),
    db.delete(rateLimit).where(lt(rateLimit.lastRequest, now - RETENTION_DAYS.rateLimit * DAY)).returning({ id: rateLimit.id }),
    db.delete(safetyEvent).where(lt(safetyEvent.createdAt, cutoff(RETENTION_DAYS.safetyEvent, now))).returning({ id: safetyEvent.id }),
    db
      .delete(safetyEvent)
      .where(and(eq(safetyEvent.restricted, true), eq(safetyEvent.escalated, false), lt(safetyEvent.createdAt, cutoff(RETENTION_DAYS.restrictedSafetyEvent, now))))
      .returning({ id: safetyEvent.id }),
    db
      .update(safetyEvent)
      .set({ excerptEnc: null, excerptUntil: null })
      .where(and(isNotNull(safetyEvent.excerptUntil), lt(safetyEvent.excerptUntil, nowDate), eq(safetyEvent.escalated, false)))
      .returning({ id: safetyEvent.id }),
    db.delete(parentReport).where(lt(parentReport.createdAt, cutoff(RETENTION_DAYS.parentReport, now))).returning({ id: parentReport.id }),
    db.delete(voiceSession).where(lt(voiceSession.startedAt, cutoff(RETENTION_DAYS.voiceSession, now))).returning({ id: voiceSession.id }),
  ]);
  const [usage, audit, gates, sessions, verifications, expiredKeys, disabledKeys, limits, safetyEvents, restrictedEvents, excerpts, parentReports, voiceSessions] = results.map((r) => r.length);
  return { usage, audit, gates, sessions, verifications, expiredKeys, disabledKeys, limits, safetyEvents, restrictedEvents, excerpts, parentReports, voiceSessions };
}
