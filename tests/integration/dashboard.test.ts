// Integration (synthetic data), Milestone 3: allowed hours and the family's own day are enforced on the
// server (D-065); the parent overview shows progress, time and safety notes but never restricted events;
// parent reports reach the safety lead's queue redacted; only listed user ids are safety leads (D-066).
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

describe.skipIf(!process.env.DATABASE_URL)("parent dashboard and allowed hours (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const { pauseFor, recordHeartbeat, weekUsage } = await import("@/child/usage");
  const { childOverview, createParentReport } = await import("@/parent/insights");
  const { isSafetyLead, reviewQueue, reviewReport } = await import("@/parent/safety-lead");
  const { recordDecision } = await import("@/safety/events");
  const { checkInputT0 } = await import("@/safety/pipeline");

  const res = await auth.api.signUpEmail({ body: { name: "Dash", email: `test+dash-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "Asia/Dubai" });
  const childId = await ops.createChild({ userId: res.user.id, householdId, nickname: null, ageBand: "7-9", locale: "en" });
  const child = { childId, householdId };
  const MONDAY_430PM_DUBAI = new Date("2026-10-12T12:30:00Z");
  const MONDAY_9PM_DUBAI = new Date("2026-10-12T17:00:00Z");

  afterAll(async () => ops.deleteAccount(res.user.id));

  it("allowed hours are enforced on the server in the family's time zone", async () => {
    await ops.updateSettings({ userId: res.user.id, householdId, childId, s: { talk: false, stories: true, dailyMinutes: 30, sound: true, schedule: [{ days: [1, 2, 3, 4, 5], start: "16:00", end: "19:00" }] } });
    expect(await pauseFor(childId, MONDAY_430PM_DUBAI)).toBeNull();
    const late = await pauseFor(childId, MONDAY_9PM_DUBAI);
    expect(late).toMatchObject({ reason: "outside_hours", sameDay: false, zone: "Asia/Dubai" });
    // a heartbeat outside the hours is not counted
    expect(await recordHeartbeat(child, MONDAY_9PM_DUBAI)).toEqual({ timeUp: true });
    expect((await weekUsage(childId, MONDAY_9PM_DUBAI)).at(-1)!.minutes).toBe(0);
  });

  it("an invalid schedule window is never saved", async () => {
    await ops.updateSettings({ userId: res.user.id, householdId, childId, s: { talk: false, stories: true, dailyMinutes: 30, sound: true, schedule: [{ days: [1], start: "19:00", end: "16:00" }] } });
    const [row] = await db.select({ schedule: s.childSettings.schedule }).from(s.childSettings).where(eq(s.childSettings.childId, childId));
    expect(row.schedule).toEqual([]); // nothing valid: no play, never "any time"
    await ops.updateSettings({ userId: res.user.id, householdId, childId, s: { talk: false, stories: true, dailyMinutes: 30, sound: true, schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "00:00", end: "24:00" }] } });
  });

  it("time is counted on the family's day: 23:30 UTC is already tomorrow in Dubai", async () => {
    await recordHeartbeat(child, new Date("2026-10-11T23:30:00Z"));
    const week = await weekUsage(childId, new Date("2026-10-12T06:00:00Z"));
    expect(week.at(-1)).toEqual({ day: "2026-10-12", minutes: 1 });
    expect(week.at(-2)).toEqual({ day: "2026-10-11", minutes: 0 });
  });

  it("the time zone is validated (Luxon) and changes are audited", async () => {
    await expect(ops.updateHouseholdTimezone({ userId: res.user.id, householdId, timezone: "Mars/Olympus" })).rejects.toThrow();
    await ops.updateHouseholdTimezone({ userId: res.user.id, householdId, timezone: "Europe/London" });
    expect((await ops.getHousehold(householdId))?.timezone).toBe("Europe/London");
    await ops.updateHouseholdTimezone({ userId: res.user.id, householdId, timezone: "Asia/Dubai" });
  });

  it("the parent overview shows progress, time and safety notes, never restricted events", async () => {
    const ctx = { childId, householdId, ageBand: "7-9" as const, locale: "en" as const, feature: "text" as const, market: "baseline" };
    await recordDecision(ctx, checkInputT0("my dad hits me"), "input"); // household: restricted
    await recordDecision(ctx, checkInputT0("kids at school hit me"), "input"); // peer: parent-visible
    const o = (await childOverview(householdId, childId))!;
    expect(o.places.map((p) => p.id)).toEqual(["home", "park", "school", "club", "market"]);
    expect(o.places[0]).toMatchObject({ state: "current", completedCount: 0, total: 5 });
    expect(o.week).toHaveLength(7);
    expect(o.summaries.map((x) => x.kind)).toEqual(["bullying"]);
    expect(await childOverview("another-household", childId)).toBeNull();
  });

  it("a parent report reaches the review queue with personal details removed; other families' children are refused", async () => {
    await createParentReport({ userId: res.user.id, householdId, childId, category: "acted_like_a_person", note: "It said it was a real girl. Call me on 0501234567" });
    await expect(createParentReport({ userId: res.user.id, householdId, childId: "someone-else", category: "other", note: "" })).rejects.toThrow();
    const q = await reviewQueue();
    const mine = q.reports.find((r) => r.householdId === householdId)!;
    expect(mine.category).toBe("acted_like_a_person");
    expect(mine.note).toContain("real girl");
    expect(mine.note).not.toContain("0501234567");
    const restricted = q.events.find((e) => e.childId === childId && e.restricted);
    expect(restricted?.category).toBe("abuse_disclosure"); // the lead sees what the parent doesn't
    await reviewReport(mine.id, res.user.id);
    expect((await reviewQueue()).reports.some((r) => r.id === mine.id)).toBe(false);
  });

  it("only listed user ids are safety leads (comma list, spaces ignored, empty = nobody)", () => {
    expect(isSafetyLead(res.user.id, "someone-else")).toBe(false);
    expect(isSafetyLead(res.user.id, ` someone-else , ${res.user.id} `)).toBe(true);
    expect(isSafetyLead(res.user.id, "")).toBe(false);
    expect(isSafetyLead(res.user.id, undefined)).toBe(false);
  });
});
