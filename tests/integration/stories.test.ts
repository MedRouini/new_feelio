// Integration (synthetic data): stories (D-070). The gate (Stories allowed, daily cap), the workshop's
// server-held slots, making a story (the writer and the picture model are stubbed: no credits), the
// child-only access to pictures, and deletion of the row and its files.
import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("@/safety/stories/write", async (orig) => {
  const m = await orig<typeof import("@/safety/stories/write")>();
  return { ...m, writeStory: async (ctx: { locale: "en" | "ar" }) => m.fallbackStory(ctx.locale) };
});
vi.mock("@/safety/images", async (orig) => {
  const m = await orig<typeof import("@/safety/images")>();
  return { ...m, makePicture: async () => ({ ok: true, url: "https://example.test/x.jpg", bytes: Buffer.from([0xff, 0xd8, 0xff]), contentType: "image/jpeg", prompt: "p" }) };
});

vi.mock("@/safety/voice-lines/tts", () => ({ narrationVoice: (l: string) => (l === "en" ? "voice" : null), narrate: async () => Buffer.from("ID3") }));

describe.skipIf(!process.env.DATABASE_URL)("stories (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const st = await import("@/child/stories");

  const res = await auth.api.signUpEmail({ body: { name: "Stories", email: `test+stories-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "UTC" });
  const id = await ops.createChild({ userId: res.user.id, householdId, nickname: null, ageBand: "7-9", locale: "en" });
  const child = { childId: id, householdId, ageBand: "7-9" as const, locale: "en" as const, keyId: "k" };
  await db.update(s.childSettings).set({ schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "00:00", end: "24:00" }] }).where(eq(s.childSettings.childId, id));

  afterAll(async () => ops.deleteAccount(res.user.id));

  it("refuses when Stories are off, and until every slot is filled", async () => {
    await db.update(s.childSettings).set({ features: { talk: false, stories: false, scenarios: true } }).where(eq(s.childSettings.childId, id));
    expect(await st.storyGate(id)).toBe("stories_off");
    await db.update(s.childSettings).set({ features: { talk: false, stories: true, scenarios: true } }).where(eq(s.childSettings.childId, id));
    expect(await st.storyGate(id)).toBeNull();
    expect(await st.setDraftListChoice(id, "hero", "elsa")).toBeNull(); // not in the list
    await st.setDraftListChoice(id, "hero", "fox");
    expect(await st.createStory(child)).toEqual({ ok: false, reason: "incomplete" });
  });

  it("makes a story from the server's slots, draws its pictures once, and serves them only to its child", async () => {
    await st.setDraftListChoice(id, "place", "forest");
    await st.setDraftListChoice(id, "feeling", "worried");
    await st.setDraftListChoice(id, "adventure", "lost_toy");
    const r = await st.createStory(child);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(await st.getDraft(id)).toEqual({}); // the workshop starts fresh
    expect(await st.drawPicture(id, r.id, 0)).toEqual({ ok: true, state: "ready" });
    expect(await st.drawPicture(id, r.id, 0)).toEqual({ ok: true, state: "ready" }); // idempotent
    expect(await st.pictureFile(id, r.id, 0)).not.toBeNull();
    expect(await st.pictureFile("someone-else", r.id, 0)).toBeNull();
    const book = await st.openBook(id, r.id);
    expect(book?.pages).toHaveLength(4);
    expect((await st.bookshelf(id))[0]).toMatchObject({ id: r.id, coverReady: true, read: true });
    // A parent deletes it: the row and the files are gone.
    expect(await st.deleteStory(householdId, r.id)).toBe(true);
    expect(await st.pictureFile(id, r.id, 0)).toBeNull();
    expect(await st.bookshelf(id)).toEqual([]);
  });

  it("narration: one new narrated story a day; its other pages and replays are free", async () => {
    const make = async () => {
      for (const [slot, v] of [["hero", "cat"], ["place", "castle"], ["feeling", "happy"], ["adventure", "storm"]] as const) await st.setDraftListChoice(id, slot, v);
      const r = await st.createStory(child);
      if (!r.ok) throw new Error(r.reason);
      return r.id;
    };
    const a = await make();
    const b = await make();
    expect((await st.narrationFile(child, a, 1)).ok).toBe(true);
    expect((await st.narrationFile(child, a, 2)).ok).toBe(true); // same story: free
    expect((await st.narrationFile(child, a, 1)).ok).toBe(true); // replay: cached
    expect(await st.narrationFile(child, b, 1)).toEqual({ ok: false, reason: "cap" });
    expect(await st.narrationFile(child, a, 9)).toEqual({ ok: false, reason: "not_found" });
    await st.deleteStory(householdId, a);
    await st.deleteStory(householdId, b);
  });

  it("a daily cap on new stories", async () => {
    for (const slot of ["hero", "place", "feeling", "adventure"] as const) await st.setDraftListChoice(id, slot, { hero: "owl", place: "garden", feeling: "proud", adventure: "birthday" }[slot]);
    for (let i = 0; i < st.STORY_DAILY_CAP; i++) {
      await st.setDraftListChoice(id, "hero", "owl");
      for (const slot of ["place", "feeling", "adventure"] as const) await st.setDraftListChoice(id, slot, { place: "garden", feeling: "proud", adventure: "birthday" }[slot]);
      await st.createStory(child);
    }
    expect(await st.storyGate(id)).toBe("daily_cap");
  });
});
