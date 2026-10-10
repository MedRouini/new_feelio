// Integration (synthetic data): onboarding writes only to its own child, the parent's settings
// are what the child scope sees, and the daily time limit is counted and enforced on the server.
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

describe.skipIf(!process.env.DATABASE_URL)("child flow (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const { applyOnboardingUpdate, getChildView } = await import("@/child/view");
  const { recordHeartbeat, secondsToday } = await import("@/child/usage");

  const res = await auth.api.signUpEmail({ body: { name: "Flow", email: `test+flow-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "ar", timezone: "UTC" });
  const a = await ops.createChild({ userId: res.user.id, householdId, nickname: "Laila", ageBand: "5-6", locale: "ar" });
  const b = await ops.createChild({ userId: res.user.id, householdId, nickname: null, ageBand: "7-9", locale: "en" });
  const childA = { childId: a, householdId, ageBand: "5-6" as const, locale: "ar" as const, keyId: "k" };
  const childB = { childId: b, householdId, ageBand: "7-9" as const, locale: "en" as const, keyId: "k" };

  afterAll(async () => ops.deleteAccount(res.user.id));

  it("a new child starts onboarding at step 0 with Home current", async () => {
    const v = await getChildView(childA);
    expect(v?.onboarding).toEqual({ step: 0, done: false });
    expect(v?.world.currentPlaceId).toBe("home");
    expect(v?.parentNickname).toBe("Laila");
  });

  it("onboarding saves choices for this child only, and resumes", async () => {
    await applyOnboardingUpdate(childA, { step: 2, avatar: { v: 1, shape: "puff", colour: "lilac", companion: "cloud" }, nickname: "parent" });
    const v = await getChildView(childA);
    expect(v?.avatar).toEqual({ v: 1, shape: "puff", colour: "lilac", companion: "cloud" });
    expect(v?.name).toBe("Laila");
    expect(v?.onboarding).toEqual({ step: 2, done: false });
    const other = await getChildView(childB);
    expect(other?.avatarChosen).toBe(false);
  });

  it("the step never goes backwards, and finishing marks it done", async () => {
    await applyOnboardingUpdate(childA, { step: 1 });
    expect((await getChildView(childA))?.onboarding.step).toBe(2);
    await applyOnboardingUpdate(childA, { step: 5, interests: ["sea"] });
    const v = await getChildView(childA);
    expect(v?.onboarding.done).toBe(true);
    expect(v?.interests).toEqual(["sea"]);
  });

  it("'parent' nickname is refused when the parent set none", async () => {
    await expect(applyOnboardingUpdate(childB, { step: 2, nickname: "parent" })).rejects.toThrow();
  });

  it("skip finishes onboarding with the default character", async () => {
    await applyOnboardingUpdate(childB, { step: 0, skip: true });
    const v = await getChildView(childB);
    expect(v?.onboarding.done).toBe(true);
    expect(v?.avatarChosen).toBe(true);
  });

  it("parent settings are what the child sees (talk, stories, sound)", async () => {
    await ops.updateSettings({ userId: res.user.id, householdId, childId: a, s: { talk: true, stories: false, dailyMinutes: 15, sound: false } });
    const v = await getChildView(childA);
    expect(v?.features).toMatchObject({ talk: true, stories: false });
    expect(v?.sound).toBe(false);
  });

  it("screen time: heartbeats are rate-limited and the limit is enforced on the server", async () => {
    const now = new Date();
    const t0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10)); // same UTC day, never near midnight
    await recordHeartbeat(childA, t0);
    await recordHeartbeat(childA, new Date(t0.getTime() + 5_000)); // too soon: not counted
    expect(await secondsToday(childA.childId, t0)).toBe(60);
    // 15-minute limit: 14 more counted minutes reach it
    let last = { timeUp: false };
    for (let i = 1; i <= 14; i++) last = await recordHeartbeat(childA, new Date(t0.getTime() + i * 60_000));
    expect(last.timeUp).toBe(true);
    expect((await getChildView(childA))?.timeUp).toBe(true);
    // once up, nothing more is added
    await recordHeartbeat(childA, new Date(t0.getTime() + 20 * 60_000));
    expect(await secondsToday(childA.childId, t0)).toBe(15 * 60);
    await db.delete(s.usageLedger).where(eq(s.usageLedger.childId, a));
  });
});
