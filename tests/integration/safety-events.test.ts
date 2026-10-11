// Integration (synthetic data): safety events store minimal fields only, a disclosure about someone at
// home is restricted (never visible to the account holder), excerpts are redacted and encrypted, every
// event is also counted anonymously, and retention follows the approved schedule (D-058).
import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

describe.skipIf(!process.env.DATABASE_URL)("safety events (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const { decryptField } = await import("@/platform/crypto");
  const { runRetention, RETENTION_DAYS } = await import("@/platform/retention");
  const { recordDecision } = await import("@/safety/events");
  const { checkInputT0 } = await import("@/safety/pipeline");

  const res = await auth.api.signUpEmail({ body: { name: "Safety", email: `test+safety-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "UTC" });
  const childId = await ops.createChild({ userId: res.user.id, householdId, nickname: null, ageBand: "7-9", locale: "en" });
  const ctx = { childId, householdId, ageBand: "7-9" as const, locale: "en" as const, feature: "text" as const, market: "baseline" };
  const events = () => db.select().from(s.safetyEvent).where(eq(s.safetyEvent.childId, childId));

  afterAll(async () => ops.deleteAccount(res.user.id));

  it("a household disclosure is restricted: not parent-visible, excerpt redacted and encrypted", async () => {
    await recordDecision(ctx, checkInputT0("my dad hits me, i live at 12 oak road"), "input");
    const [e] = (await events()).filter((x) => x.category === "abuse_disclosure");
    expect(e).toMatchObject({ restricted: true, parentVisible: false, actorClass: "household_caregiver", level: "high", action: "crisis" });
    expect(e.excerptEnc).not.toContain("dad");
    const plain = decryptField(e.excerptEnc!);
    expect(plain).toContain("my dad hits me");
    expect(plain).not.toContain("oak road");
    expect(e.excerptUntil!.getTime()).toBeGreaterThan(Date.now() + 29 * 86_400_000);
  });

  it("a disclosure about someone outside the home is visible to the parent", async () => {
    await recordDecision(ctx, checkInputT0("my teacher hits me"), "input");
    const e = (await events()).find((x) => x.actorClass === "other_known_adult")!;
    expect(e).toMatchObject({ restricted: false, parentVisible: true });
  });

  it("aggregate-only categories are counted but not stored per child; ordinary feelings store nothing", async () => {
    const before = (await events()).length;
    await recordDecision(ctx, checkInputT0("what is sex"), "input");
    await recordDecision(ctx, checkInputT0("i'm sad today"), "input");
    expect((await events()).length).toBe(before);
    const day = new Date().toISOString().slice(0, 10);
    const [c] = await db
      .select()
      .from(s.safetyEventCount)
      .where(and(eq(s.safetyEventCount.day, day), eq(s.safetyEventCount.category, "sexual"), eq(s.safetyEventCount.feature, "text")));
    expect(c.count).toBeGreaterThanOrEqual(1);
  });

  it("retention: excerpts are shredded after 30 days, restricted events deleted after 30, others after 90", async () => {
    const day = 86_400_000;
    const base = { childId, householdId, category: "self_harm", severity: 3, level: "high" as const, feature: "text", locale: "en", phase: "input" as const, source: "t0" as const, action: "crisis" };
    const [oldExcerpt] = await db.insert(s.safetyEvent).values({ ...base, excerptEnc: "v1.x.y.z", excerptUntil: new Date(Date.now() - day) }).returning();
    const [oldRestricted] = await db.insert(s.safetyEvent).values({ ...base, category: "abuse_disclosure", restricted: true, createdAt: new Date(Date.now() - (RETENTION_DAYS.restrictedSafetyEvent + 1) * day) }).returning();
    const [escalated] = await db.insert(s.safetyEvent).values({ ...base, category: "abuse_disclosure", restricted: true, escalated: true, createdAt: new Date(Date.now() - (RETENTION_DAYS.restrictedSafetyEvent + 1) * day) }).returning();
    const [old] = await db.insert(s.safetyEvent).values({ ...base, createdAt: new Date(Date.now() - (RETENTION_DAYS.safetyEvent + 1) * day) }).returning();
    await runRetention();
    const byId = async (id: string) => (await db.select().from(s.safetyEvent).where(eq(s.safetyEvent.id, id)))[0];
    expect((await byId(oldExcerpt.id)).excerptEnc).toBeNull();
    expect(await byId(oldRestricted.id)).toBeUndefined();
    expect(await byId(escalated.id)).toBeDefined(); // escalated: kept for the safety lead
    expect(await byId(old.id)).toBeUndefined();
  });

  it("deleting the account deletes the child's safety events", async () => {
    const r2 = await auth.api.signUpEmail({ body: { name: "Safety2", email: `test+safety2-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
    const h2 = await ops.recordConsentAndCreateHousehold({ userId: r2.user.id, locale: "en", timezone: "UTC" });
    const c2 = await ops.createChild({ userId: r2.user.id, householdId: h2, nickname: null, ageBand: "7-9", locale: "en" });
    await recordDecision({ ...ctx, childId: c2, householdId: h2 }, checkInputT0("my teacher hits me"), "input");
    const of2 = () => db.select().from(s.safetyEvent).where(eq(s.safetyEvent.childId, c2));
    expect((await of2()).length).toBe(1);
    await ops.deleteAccount(r2.user.id);
    expect(await of2()).toHaveLength(0);
  });
});
