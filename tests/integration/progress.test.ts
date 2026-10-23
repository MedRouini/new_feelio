// Integration (synthetic data): level progress is checked and stored on the server (D-056). Opening a
// level makes it "in progress"; finishing its artifacts completes it and unlocks the next level; three
// Home levels open the Park. Locked levels, foreign artifacts and switched-off scenarios are refused.
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

describe.skipIf(!process.env.DATABASE_URL)("level progress (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const { completeArtifact, getWorldState, startArtifact } = await import("@/child/progress");
  const { DEV_TEST_ARTIFACT } = await import("@/world/artifacts/catalog");

  const res = await auth.api.signUpEmail({ body: { name: "Progress", email: `test+progress-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "UTC" });
  const id = await ops.createChild({ userId: res.user.id, householdId, nickname: null, ageBand: "7-9", locale: "en" });
  const child = { childId: id, householdId, ageBand: "7-9" as const, locale: "en" as const, keyId: "k" };
  // all-day hours, so the test doesn't depend on the time it runs (allowed hours are tested separately)
  await db.update(s.childSettings).set({ schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "00:00", end: "24:00" }] }).where(eq(s.childSettings.childId, id));
  const A = DEV_TEST_ARTIFACT; // levels without a built artifact use the stand-in (NODE_ENV=test)

  afterAll(async () => ops.deleteAccount(res.user.id));

  it("refuses locked levels and artifacts that don't belong to the level", async () => {
    expect(await startArtifact(child, "home-2", A)).toEqual({ ok: false, reason: "locked" });
    expect(await completeArtifact(child, "park-1", A)).toEqual({ ok: false, reason: "locked" });
    expect(await startArtifact(child, "home-1", "someone-else")).toEqual({ ok: false, reason: "not_in_level" });
    expect(await startArtifact(child, "nope", A)).toEqual({ ok: false, reason: "unknown" });
  });

  it("opening a level makes it in progress; finishing it completes it and opens the next", async () => {
    expect(await startArtifact(child, "home-1", A)).toEqual({ ok: true });
    expect((await getWorldState(id)).places.home.levels["home-1"]).toBe("in_progress");
    const r = await completeArtifact(child, "home-1", A);
    expect(r).toMatchObject({ ok: true, levelCompleted: true, nextLevelId: "home-2", nextLevelOpened: true, placeCompleted: false, openedPlaceIds: [] });
    const w = await getWorldState(id);
    expect(w.places.home.levels["home-1"]).toBe("completed");
    expect(w.places.home.levels["home-2"]).toBe("available");
  });

  it("replaying a completed level keeps it completed and unlocks nothing new", async () => {
    await startArtifact(child, "home-1", A);
    const r = await completeArtifact(child, "home-1", A);
    expect(r).toMatchObject({ ok: true, levelCompleted: true, nextLevelOpened: false });
    expect((await getWorldState(id)).places.home.levels["home-1"]).toBe("completed");
  });

  it("the third Home level opens the Park", async () => {
    await completeArtifact(child, "home-2", A);
    expect(await completeArtifact(child, "home-3", A)).toEqual({ ok: false, reason: "not_in_level" }); // home-3 has The Tower
    const r = await completeArtifact(child, "home-3", "home-3-tower");
    expect(r).toMatchObject({ ok: true, openedPlaceIds: ["park"] });
  });

  it("scenarios switched off by the parent: refused on the server", async () => {
    await db.update(s.childSettings).set({ features: { talk: false, stories: true, scenarios: false } }).where(eq(s.childSettings.childId, id));
    expect(await startArtifact(child, "home-4", A)).toEqual({ ok: false, reason: "disabled" });
    expect(await completeArtifact(child, "home-4", A)).toEqual({ ok: false, reason: "disabled" });
  });
});
