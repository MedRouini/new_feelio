import "server-only";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/platform/db/client";
import { adultGate, apikey, auditLog, rateLimit, session, usageLedger, verification } from "@/platform/db/schema";

// Retention table (CR-6). Proposals awaiting owner sign-off are in docs/ARCHITECTURE.md §7.
// Safety events (90 d) and excerpts (30 d) join this list in Milestone 2.
export const RETENTION_DAYS = {
  usageLedger: 90,
  auditLog: 365,
  adultGate: 1,
  rateLimit: 1,
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
  ]);
  const [usage, audit, gates, sessions, verifications, expiredKeys, disabledKeys, limits] = results.map((r) => r.length);
  return { usage, audit, gates, sessions, verifications, expiredKeys, disabledKeys, limits };
}
