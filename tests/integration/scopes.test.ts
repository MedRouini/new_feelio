// Integration tests against the real database (synthetic data only; CLAUDE.md free-tier rule).
// They prove the server-side enforcement claims of Milestone 1 (SPEC §7, CR-2):
//  - a child device key never acts as a parent session
//  - a parent session never passes as a child key
//  - keys are bound to one child and one household, and stop working when revoked or deleted
//  - one household cannot reach another household's children or devices
//  - the adult gate expires, and deletion really deletes
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("scope separation (integration, synthetic data)", async () => {
  const { auth } = await import("@/auth/server");
  const { adultGatePassed, getParent, verifyChildKey } = await import("@/auth/guards");
  const ops = await import("@/parent/operations");
  const { db } = await import("@/platform/db/client");
  const s = await import("@/platform/db/schema");
  const { CHILD_DEVICE_CONFIG_ID } = await import("@/auth/constants");

  type Parent = { userId: string; token: string; cookie: string; householdId: string; childId: string; key: string; keyId: string };
  const created: string[] = [];

  async function makeParent(tag: string): Promise<Parent> {
    const email = `test+${tag}-${crypto.randomUUID()}@example.test`;
    const { response: res, headers } = await auth.api.signUpEmail({
      body: { name: `Test ${tag}`, email, password: "correct-horse-battery" },
      returnHeaders: true,
    });
    created.push(res.user.id);
    // The real signed session cookie, exactly as a browser would send it back.
    const cookie = headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: "en", timezone: "UTC" });
    const childId = await ops.createChild({ userId: res.user.id, householdId, nickname: "Sami", ageBand: "7-9", locale: "ar" });
    const { key, id } = await ops.createDeviceKey({ userId: res.user.id, householdId, childId, label: "Tablet" });
    return { userId: res.user.id, token: res.token!, cookie, householdId, childId, key, keyId: id };
  }

  let a: Parent;
  let b: Parent;

  beforeAll(async () => {
    a = await makeParent("a");
    b = await makeParent("b");
  });

  afterAll(async () => {
    for (const id of created) await ops.deleteAccount(id);
  });

  it("a valid child key resolves to exactly its child", async () => {
    const c = await verifyChildKey(a.key);
    expect(c).toMatchObject({ childId: a.childId, householdId: a.householdId, ageBand: "7-9", locale: "ar" });
  });

  it("child keys are stored hashed, never in plaintext", async () => {
    const [row] = await db.select({ key: s.apikey.key }).from(s.apikey).where(eq(s.apikey.id, a.keyId));
    expect(row.key).not.toBe(a.key);
    expect(row.key).not.toContain(a.key.slice(3, 20));
  });

  it("a child key never acts as a parent session (header or cookie)", async () => {
    expect(await auth.api.getSession({ headers: new Headers({ "x-api-key": a.key }) })).toBeNull();
    expect(await getParent(new Headers({ "x-api-key": a.key, cookie: `feelio_device=${a.key}` }))).toBeNull();
  });

  it("a parent session never passes as a child key", async () => {
    expect(await verifyChildKey(a.token)).toBeNull();
    expect(await getParent(new Headers({ cookie: a.cookie }))).toMatchObject({ userId: a.userId, householdId: a.householdId });
  });

  it("garbage and tampered keys are rejected", async () => {
    expect(await verifyChildKey("fk_not-a-real-key")).toBeNull();
    expect(await verifyChildKey(a.key.slice(0, -2) + "xx")).toBeNull();
    expect(await verifyChildKey("")).toBeNull();
  });

  it("a key without the child permission is rejected", async () => {
    const plain = await auth.api.createApiKey({
      body: { userId: a.userId, configId: CHILD_DEVICE_CONFIG_ID, metadata: { childId: a.childId, householdId: a.householdId } },
    });
    expect(await verifyChildKey(plain.key)).toBeNull();
    await db.delete(s.apikey).where(eq(s.apikey.id, plain.id));
  });

  it("households are isolated from each other", async () => {
    expect(await ops.getChildInHousehold(b.householdId, a.childId)).toBeNull();
    await expect(ops.createDeviceKey({ userId: b.userId, householdId: b.householdId, childId: a.childId, label: "x" })).rejects.toThrow();
    await expect(ops.revokeDevice({ userId: b.userId, householdId: b.householdId, keyId: a.keyId })).rejects.toThrow();
    await expect(ops.deleteChild({ userId: b.userId, householdId: b.householdId, childId: a.childId })).rejects.toThrow();
    expect((await ops.listChildren(b.householdId)).map((c) => c.id)).not.toContain(a.childId);
    expect(await verifyChildKey(a.key)).not.toBeNull(); // A is untouched
  });

  it("the nickname is encrypted at rest and readable by its parent", async () => {
    const [row] = await db.select({ n: s.childProfile.nicknameEnc }).from(s.childProfile).where(eq(s.childProfile.id, a.childId));
    expect(row.n).not.toContain("Sami");
    expect((await ops.listChildren(a.householdId))[0].nickname).toBe("Sami");
  });

  it("a revoked key stops working immediately", async () => {
    const extra = await ops.createDeviceKey({ userId: a.userId, householdId: a.householdId, childId: a.childId, label: "Phone" });
    expect(await verifyChildKey(extra.key)).not.toBeNull();
    await ops.revokeDevice({ userId: a.userId, householdId: a.householdId, keyId: extra.id });
    expect(await verifyChildKey(extra.key)).toBeNull();
  });

  it("the adult gate is closed until passed and expires", async () => {
    const [sess] = await db.select().from(s.session).where(eq(s.session.token, a.token));
    await db.delete(s.adultGate).where(eq(s.adultGate.sessionId, sess.id));
    expect(await adultGatePassed(sess.id, "area")).toBe(false);
    await db.insert(s.adultGate).values({ sessionId: sess.id, userId: a.userId, passedAt: new Date() });
    expect(await adultGatePassed(sess.id, "area")).toBe(true);
    expect(await adultGatePassed(sess.id, "sensitive")).toBe(true);
    await db.update(s.adultGate).set({ passedAt: new Date(Date.now() - 10 * 60_000) }).where(eq(s.adultGate.sessionId, sess.id));
    expect(await adultGatePassed(sess.id, "sensitive")).toBe(false); // 5-minute window
    expect(await adultGatePassed(sess.id, "area")).toBe(true); // 30-minute window
  });

  it("consent is required before a child profile can exist", async () => {
    const res = await auth.api.signUpEmail({ body: { name: "No consent", email: `test+nc-${crypto.randomUUID()}@example.test`, password: "correct-horse-battery" } });
    created.push(res.user.id);
    const [h] = await db.insert(s.household).values({ ownerUserId: res.user.id, market: "baseline" }).returning();
    await expect(ops.createChild({ userId: res.user.id, householdId: h.id, nickname: null, ageBand: "5-6", locale: "en" })).rejects.toThrow(/Consent/);
  });

  it("deleting a child removes its profile, settings and device keys; the key stops working", async () => {
    const extraChild = await ops.createChild({ userId: a.userId, householdId: a.householdId, nickname: null, ageBand: "10-12", locale: "en" });
    const k = await ops.createDeviceKey({ userId: a.userId, householdId: a.householdId, childId: extraChild, label: "x" });
    await ops.deleteChild({ userId: a.userId, householdId: a.householdId, childId: extraChild });
    expect(await verifyChildKey(k.key)).toBeNull();
    expect(await db.select().from(s.childSettings).where(eq(s.childSettings.childId, extraChild))).toHaveLength(0);
    expect(await db.select().from(s.apikey).where(eq(s.apikey.id, k.id))).toHaveLength(0);
  });

  it("deleting an account removes everything, including device keys (no FK)", async () => {
    const c = await makeParent("c");
    await ops.deleteAccount(c.userId);
    created.splice(created.indexOf(c.userId), 1);
    expect(await verifyChildKey(c.key)).toBeNull();
    expect(await db.select().from(s.household).where(eq(s.household.id, c.householdId))).toHaveLength(0);
    expect(await db.select().from(s.childProfile).where(eq(s.childProfile.id, c.childId))).toHaveLength(0);
    expect(await db.select().from(s.consentRecord).where(eq(s.consentRecord.householdId, c.householdId))).toHaveLength(0);
    expect(await db.select().from(s.apikey).where(inArray(s.apikey.referenceId, [c.userId]))).toHaveLength(0);
    expect(await db.select().from(s.session).where(eq(s.session.userId, c.userId))).toHaveLength(0);
  });
});
