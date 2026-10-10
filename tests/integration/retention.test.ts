import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

describe.skipIf(!process.env.DATABASE_URL)("retention (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const { runRetention, RETENTION_DAYS } = await import("@/platform/retention");

  const res = await auth.api.signUpEmail({ body: { name: "Retention", email: `test+ret-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "UTC" });
  const childId = await ops.createChild({ userId: res.user.id, householdId, nickname: null, ageBand: "5-6", locale: "en" });

  afterAll(async () => ops.deleteAccount(res.user.id));

  it("deletes usage rows past their retention period and keeps recent ones", async () => {
    const old = new Date(Date.now() - (RETENTION_DAYS.usageLedger + 1) * 86_400_000);
    const [oldRow] = await db.insert(s.usageLedger).values({ childId, householdId, day: "2026-01-01", feature: "test", createdAt: old }).returning();
    const [newRow] = await db.insert(s.usageLedger).values({ childId, householdId, day: "2026-10-10", feature: "test" }).returning();
    const deleted = await runRetention();
    expect(deleted.usage).toBeGreaterThanOrEqual(1);
    expect(await db.select().from(s.usageLedger).where(eq(s.usageLedger.id, oldRow.id))).toHaveLength(0);
    expect(await db.select().from(s.usageLedger).where(eq(s.usageLedger.id, newRow.id))).toHaveLength(1);
  });
});
