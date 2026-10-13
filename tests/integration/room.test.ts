// Integration (synthetic data): My room (D-074). Unlocks from stories and feelings, never lowered by a
// deletion; the server refuses locked, unknown and wrong-area items; seen never passes reached; names
// only from the list or the parent's nickname.
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

describe.skipIf(!process.env.DATABASE_URL)("my room (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const room = await import("@/child/room");
  const { fallbackStory } = await import("@/safety/stories/write");
  const { choice } = await import("@/safety/stories/choices");

  const res = await auth.api.signUpEmail({ body: { name: "Room", email: `test+room-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "UTC" });
  const id = await ops.createChild({ userId: res.user.id, householdId, nickname: null, ageBand: "7-9", locale: "en" });
  await db
    .update(s.childProfile)
    .set({ avatar: { v: 1, shape: "bun", colour: "amber", companion: "star" }, nicknameKey: "pip", onboarding: { step: 6, completedAt: new Date().toISOString() } })
    .where(eq(s.childProfile.id, id));
  afterAll(async () => ops.deleteAccount(res.user.id));

  const addStory = async (feeling: string) => {
    const f = fallbackStory("en");
    const [row] = await db
      .insert(s.story)
      .values({
        childId: id,
        householdId,
        locale: "en",
        ageBand: "7-9",
        choices: { hero: choice("hero", "fox")!, place: choice("place", "forest")!, feeling: choice("feeling", feeling)!, adventure: choice("adventure", "lost_toy")! },
        content: { title: f.title, heroLook: f.heroLook, pages: f.pages, question: f.question },
        source: "fallback",
        pictures: Array.from({ length: 5 }, () => ({ state: "fallback" as const })),
        seed: 1,
        versions: { test: "room" },
      })
      .returning({ id: s.story.id });
    return row.id;
  };

  it("starts with the free items, refuses locked, unknown and wrong-area items", async () => {
    const st = await room.roomState(id, true);
    expect(st.reached).toBe(2);
    expect(st.seen).toBe(2);
    expect(st.stepsToNext).toBe(3);
    expect(await room.applyRoomUpdate(id, { action: "wear", slot: "head", item: "party_hat" })).toEqual({ ok: true });
    expect(await room.applyRoomUpdate(id, { action: "wear", slot: "neck", item: "scarf" })).toEqual({ ok: false }); // 3rd item: locked
    expect(await room.applyRoomUpdate(id, { action: "wear", slot: "face", item: "party_hat" })).toEqual({ ok: false }); // wrong area
    expect(room.roomUpdateSchema.safeParse({ action: "wear", slot: "head", item: "crown_of_gold" }).success).toBe(false);
    expect((await room.roomState(id, true)).avatar.wear).toEqual({ head: "party_hat" });
    expect(await room.applyRoomUpdate(id, { action: "wear", slot: "head", item: null })).toEqual({ ok: true });
    expect((await room.roomState(id, true)).avatar.wear).toEqual({});
  });

  it("unlocks from stories and feelings, opens one surprise per call, and never goes down", async () => {
    const a = await addStory("worried");
    const b = await addStory("happy"); // 2 stories + 2 feelings = 4 points → 3 items
    let st = await room.roomState(id, true);
    expect(st.points).toBe(4);
    expect(st.reached).toBe(3);
    expect(st.seen).toBe(2);
    expect(await room.applyRoomUpdate(id, { action: "seen" })).toEqual({ ok: true, opened: "scarf" });
    expect(await room.applyRoomUpdate(id, { action: "seen" })).toEqual({ ok: false }); // nothing more to open
    expect((await room.roomState(id, true)).seen).toBe(3);
    expect(await room.applyRoomUpdate(id, { action: "wear", slot: "neck", item: "scarf" })).toEqual({ ok: true });
    // A parent deletes both stories: the scarf stays open and worn.
    await db.delete(s.story).where(eq(s.story.id, a));
    await db.delete(s.story).where(eq(s.story.id, b));
    st = await room.roomState(id, true);
    expect(st.points).toBe(0);
    expect(st.reached).toBe(3);
    expect(st.avatar.wear).toEqual({ neck: "scarf" });
    expect(await room.applyRoomUpdate(id, { action: "wear", slot: "neck", item: "scarf" })).toEqual({ ok: true });
  });

  it("counts stories toward points even when Stories are off, but hides the book count", async () => {
    await addStory("sad");
    const st = await room.roomState(id, false);
    expect(st.books).toBeNull();
    expect(st.points).toBeGreaterThan(0);
  });

  it("review fix: onboarding can never put on or take off wardrobe items", async () => {
    const { applyOnboardingUpdate } = await import("@/child/view");
    const child = { childId: id, householdId, ageBand: "7-9" as const, locale: "en" as const, keyId: "k" };
    for (const slot of ["head", "face", "neck", "back"] as const) await room.applyRoomUpdate(id, { action: "wear", slot, item: null });
    await room.applyRoomUpdate(id, { action: "wear", slot: "head", item: "party_hat" });
    // a locked item smuggled in through the onboarding route is ignored, and the worn hat stays
    await applyOnboardingUpdate(child, { step: 6, avatar: { v: 1, shape: "bun", colour: "sky", companion: "star", wear: { back: "butterfly_wings" } } as never });
    const st = await room.roomState(id, true);
    expect(st.avatar.wear).toEqual({ head: "party_hat" });
    expect(st.avatar.colour).toBe("sky");
    await room.applyRoomUpdate(id, { action: "wear", slot: "head", item: null });
  });

  it("review fix: quick changes in a row all stick (no lost updates)", async () => {
    for (const slot of ["head", "face", "neck", "back"] as const) await room.applyRoomUpdate(id, { action: "wear", slot, item: null });
    await Promise.all([
      room.applyRoomUpdate(id, { action: "wear", slot: "head", item: "party_hat" }),
      room.applyRoomUpdate(id, { action: "wear", slot: "face", item: "round_glasses" }),
      room.applyRoomUpdate(id, { action: "colour", colour: "lilac" }),
    ]);
    const st = await room.roomState(id, true);
    expect(st.avatar.wear).toEqual({ head: "party_hat", face: "round_glasses" });
    expect(st.avatar.colour).toBe("lilac");
    await room.applyRoomUpdate(id, { action: "wear", slot: "head", item: null });
    await room.applyRoomUpdate(id, { action: "wear", slot: "face", item: null });
  });

  it("changes colour, name (list or the parent's nickname only) and likes", async () => {
    expect(await room.applyRoomUpdate(id, { action: "colour", colour: "rose" })).toEqual({ ok: true });
    expect(await room.applyRoomUpdate(id, { action: "nickname", nickname: "parent" })).toEqual({ ok: false }); // no parent nickname
    expect(await room.applyRoomUpdate(id, { action: "nickname", nickname: "sunny" })).toEqual({ ok: true });
    expect(await room.applyRoomUpdate(id, { action: "interests", interests: ["space", "sea"] })).toEqual({ ok: true });
    expect(room.roomUpdateSchema.safeParse({ action: "interests", interests: ["space", "sea", "music", "blocks"] }).success).toBe(false);
    expect(room.roomUpdateSchema.safeParse({ action: "nickname", nickname: "anything typed" }).success).toBe(false);
    const st = await room.roomState(id, true);
    expect(st.avatar.colour).toBe("rose");
    expect(st.nicknameKey).toBe("sunny");
    expect(st.name).toBe("Sunny");
    expect(st.interests).toEqual(["space", "sea"]);
  });
});
