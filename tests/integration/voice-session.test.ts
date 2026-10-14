// Integration (synthetic data): the voice session gate (D-068). Every check is on the server: the global
// switch, the provider-approval flag (adult testing, D-005), Talk allowed by the parent, today's voice
// minutes, one session at a time. The proxy finds an open session by id and gets its context from the
// database; an ended session answers nothing. ElevenLabs is not called (the token is stubbed).
import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const flags = vi.hoisted(() => ({ VOICE_ENABLED: true, VOICE_ADULT_TESTING: true }));
vi.mock("@/platform/env", async (orig) => {
  const m = await orig<typeof import("@/platform/env")>();
  return { ...m, env: () => ({ ...m.env(), ...flags }) };
});
vi.mock("@/safety/voice-agent/provider", () => ({
  voiceConfigured: () => true,
  conversationToken: async () => ({ token: "test-token", conversationId: `conv_test${crypto.randomUUID().replace(/-/g, "")}` }),
}));

describe.skipIf(!process.env.DATABASE_URL)("voice session gate (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const { startVoiceSession, endVoiceSession, proxyTurn, voiceSecondsToday, MAX_SESSION_S } = await import("@/child/voice");

  const res = await auth.api.signUpEmail({ body: { name: "Voice", email: `test+voice-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "UTC" });
  const id = await ops.createChild({ userId: res.user.id, householdId, nickname: "Secret Name", ageBand: "7-9", locale: "en" });
  const child = { childId: id, householdId, ageBand: "7-9" as const, locale: "en" as const, keyId: "k" };
  await db
    .update(s.childSettings)
    .set({ schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "00:00", end: "24:00" }], features: { talk: false, stories: true, scenarios: true } })
    .where(eq(s.childSettings.childId, id));
  await db.update(s.childProfile).set({ nicknameKey: "parent", interests: ["space"] }).where(eq(s.childProfile.id, id));

  afterAll(async () => ops.deleteAccount(res.user.id));

  it("refuses when Talk is off, voice is switched off, or it isn't approved for children", async () => {
    expect(await startVoiceSession(child)).toEqual({ ok: false, reason: "talk_off" });
    await db.update(s.childSettings).set({ features: { talk: true, stories: true, scenarios: true } }).where(eq(s.childSettings.childId, id));
    flags.VOICE_ENABLED = false;
    expect(await startVoiceSession(child)).toEqual({ ok: false, reason: "off" });
    flags.VOICE_ENABLED = true;
    flags.VOICE_ADULT_TESTING = false;
    expect(await startVoiceSession(child)).toEqual({ ok: false, reason: "not_approved" });
    flags.VOICE_ADULT_TESTING = true;
  });

  it("issues one session at a time, bound to the server's data, and the proxy finds it", async () => {
    const r = await startVoiceSession(child, { placeId: "home" });
    expect(r).toMatchObject({ ok: true, token: "test-token", allowedSeconds: MAX_SESSION_S });
    if (!r.ok) return;
    expect(await startVoiceSession(child)).toEqual({ ok: false, reason: "busy" });

    const turn = await proxyTurn({ sessionId: r.sessionId });
    expect(turn.ok).toBe(true);
    if (!turn.ok) return;
    expect(turn.stop).toBeNull();
    expect(turn.ctx).toMatchObject({ childId: id, ageBand: "7-9", locale: "en", feature: "voice", placeId: "home" });
    expect(turn.session.adultTest).toBe(true);
    // The parent's typed nickname never goes to a model; interests (ids) do.
    expect(turn.context.name).toBeNull();
    expect(JSON.stringify(turn.context)).not.toContain("Secret Name");
    expect(turn.context.interests).toEqual(["space"]);
    expect(turn.context.placesOpen).toContain("home");
    // A story is offered only when story making is open for this child now (D-076): the same server gate.
    const { storyGate } = await import("@/child/stories");
    expect(turn.context.storiesOpen).toBe((await storyGate(id)) === null);

    // Nonsense ids find nothing.
    expect((await proxyTurn({ sessionId: "not-a-uuid" })).ok).toBe(false);
    expect((await proxyTurn({ conversationId: "{{system__conversation_id}}" })).ok).toBe(false);

    await endVoiceSession(child, r.sessionId);
    expect((await proxyTurn({ sessionId: r.sessionId })).ok).toBe(false);
    const ledger = await db.select().from(s.usageLedger).where(eq(s.usageLedger.childId, id));
    expect(ledger.filter((l) => l.feature === "voice")).toHaveLength(1);
  });

  it("never offers a story when the parent has Stories off (D-076)", async () => {
    await db.update(s.childSettings).set({ features: { talk: true, stories: false, scenarios: true } }).where(eq(s.childSettings.childId, id));
    const r = await startVoiceSession(child);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const turn = await proxyTurn({ sessionId: r.sessionId });
    expect(turn.ok && turn.context.storiesOpen).toBe(false);
    await endVoiceSession(child, r.sessionId);
    await db.update(s.childSettings).set({ features: { talk: true, stories: true, scenarios: true } }).where(eq(s.childSettings.childId, id));
  });

  it("an unended session counts until its time runs out; then the daily voice minutes stop new talks", async () => {
    await db.update(s.childSettings).set({ voiceDailyMinutes: 2 }).where(eq(s.childSettings.childId, id));
    const past = new Date(Date.now() - 10 * 60_000);
    await db.insert(s.voiceSession).values({ childId: id, householdId, conversationId: `conv_old${crypto.randomUUID().replace(/-/g, "")}`, ageBand: "7-9", locale: "en", allowedSeconds: 120, startedAt: past });
    expect(await voiceSecondsToday(id)).toBeGreaterThanOrEqual(120);
    expect(await startVoiceSession(child)).toEqual({ ok: false, reason: "voice_time_up" });
  });
});
