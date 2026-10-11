import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/platform/db/client";
import { encryptField } from "@/platform/crypto";
import { safetyEvent, safetyEventCount } from "@/platform/db/schema";
import { routeOf } from "./router";
import type { Decision, Finding, SafetyCtx } from "./types";

// Safety events (SAFETY_POLICY §1 G, §5, §7; retention D-058). Minimal fields; never the conversation
// or audio. Every recorded finding also increments an anonymous daily count (SR-42).

export const EXCERPT_DAYS = 30;
const EXCERPT_MAX = 200;
const DISCLOSURE = new Set(["abuse_disclosure", "grooming", "sextortion", "sexual_minor"]);

/** A disclosure about someone at home, or someone unclear, never reaches the account holder (§5). */
export function isRestricted(f: Finding): boolean {
  return DISCLOSURE.has(f.category) && (f.actorClass === undefined || f.actorClass === "household_caregiver" || f.actorClass === "unknown");
}

/** Records the findings of one decision. `phase` says whether it was the child's words or our model's. */
export async function recordDecision(ctx: SafetyCtx, decision: Decision, phase: "input" | "output"): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const rows = decision.findings.map((f) => ({ f, level: routeOf(f)?.event ?? "none" })).filter((x) => x.level !== "none");
  if (!rows.length) return;

  const writes = [];
  for (const { f, level } of rows) {
    writes.push(
      db
        .insert(safetyEventCount)
        .values({ day, category: f.category, severity: f.severity, feature: ctx.feature, phase, count: 1 })
        .onConflictDoUpdate({
          target: [safetyEventCount.day, safetyEventCount.category, safetyEventCount.severity, safetyEventCount.feature, safetyEventCount.phase],
          set: { count: sql`${safetyEventCount.count} + 1` },
        }),
    );
    // Aggregate-only categories, and turns with no child (adult tests), are counted, not stored.
    if (level === "aggregate" || level === "none" || !ctx.childId) continue;
    const restricted = isRestricted(f);
    const withExcerpt = (level === "medium" || level === "high") && phase === "input" && decision.redacted.length > 0;
    writes.push(
      db.insert(safetyEvent).values({
        childId: ctx.childId,
        householdId: ctx.householdId,
        category: f.category,
        severity: f.severity,
        level,
        actorClass: f.actorClass ?? null,
        feature: ctx.feature,
        locale: ctx.locale,
        phase,
        source: f.source,
        action: decision.action.type,
        restricted,
        parentVisible: !restricted && (level === "medium" || level === "high" || f.category === "dependency"),
        excerptEnc: withExcerpt ? encryptField(decision.redacted.slice(0, EXCERPT_MAX)) : null,
        excerptUntil: withExcerpt ? new Date(Date.now() + EXCERPT_DAYS * 86_400_000) : null,
      }),
    );
  }
  await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);
}
