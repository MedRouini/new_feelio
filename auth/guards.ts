import "server-only";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/auth/server";
import { CHILD_DEVICE_CONFIG_ID, CHILD_DEVICE_COOKIE, CHILD_PERMISSIONS } from "@/auth/constants";
import { db } from "@/platform/db/client";
import { adultGate, childProfile, household } from "@/platform/db/schema";
import { env } from "@/platform/env";

// Server-side enforcement (CR-2). Two separate scopes (SPEC §7):
//  - parent: a Better Auth session on the dashboard host, plus a recent password re-check (adult gate)
//  - child:  a Better Auth API key (configId "child-device") bound to one child; never a session
// Every page, route handler and server action calls one of these. The proxy is not an auth layer.

export type ParentContext = {
  userId: string;
  sessionId: string;
  email: string;
  householdId: string | null;
};

export type ChildContext = {
  childId: string;
  householdId: string;
  ageBand: "5-6" | "7-9" | "10-12";
  locale: "en" | "ar";
  keyId: string;
};

export async function getParent(reqHeaders?: Headers): Promise<ParentContext | null> {
  const s = await auth.api.getSession({ headers: reqHeaders ?? (await headers()) });
  if (!s) return null;
  const [h] = await db
    .select({ id: household.id })
    .from(household)
    .where(eq(household.ownerUserId, s.user.id))
    .limit(1);
  return { userId: s.user.id, sessionId: s.session.id, email: s.user.email, householdId: h?.id ?? null };
}

/** Minutes since this session last passed the adult gate, or null if never. */
export async function adultGateAgeMinutes(sessionId: string): Promise<number | null> {
  const [g] = await db.select().from(adultGate).where(eq(adultGate.sessionId, sessionId)).limit(1);
  if (!g) return null;
  return (Date.now() - g.passedAt.getTime()) / 60_000;
}

export type GateLevel = "area" | "sensitive";

export async function adultGatePassed(sessionId: string, level: GateLevel): Promise<boolean> {
  const age = await adultGateAgeMinutes(sessionId);
  if (age === null) return false;
  const limit = level === "sensitive" ? env().ADULT_GATE_SENSITIVE_MINUTES : env().ADULT_GATE_MINUTES;
  return age <= limit;
}

/** Re-checks the parent's password with Better Auth and records the pass for this session. */
export async function passAdultGate(password: string): Promise<boolean> {
  const h = await headers();
  const parent = await getParent(h);
  if (!parent) return false;
  try {
    await auth.api.verifyPassword({ body: { password }, headers: h });
  } catch {
    return false;
  }
  await db
    .insert(adultGate)
    .values({ sessionId: parent.sessionId, userId: parent.userId, passedAt: new Date() })
    .onConflictDoUpdate({ target: adultGate.sessionId, set: { passedAt: new Date() } });
  return true;
}

export type ParentCheck =
  | { ok: true; parent: ParentContext }
  | { ok: false; reason: "signed_out" | "gate_required" | "no_household" };

/** For route handlers and server actions: never trusts anything but the session. */
export async function checkParent(opts: { gate?: GateLevel; needHousehold?: boolean } = {}): Promise<ParentCheck> {
  const parent = await getParent();
  if (!parent) return { ok: false, reason: "signed_out" };
  if (opts.gate && !(await adultGatePassed(parent.sessionId, opts.gate))) {
    return { ok: false, reason: "gate_required" };
  }
  if (opts.needHousehold && !parent.householdId) return { ok: false, reason: "no_household" };
  return { ok: true, parent };
}

/** Verifies a child device key; null if absent, invalid, expired, revoked or unbound. */
export async function verifyChildKey(key: string | undefined | null): Promise<ChildContext | null> {
  if (!key) return null;
  const result = await auth.api.verifyApiKey({
    body: { key, configId: CHILD_DEVICE_CONFIG_ID, permissions: { child: [...CHILD_PERMISSIONS.child] } },
  });
  if (!result.valid || !result.key) return null;
  const meta = (result.key.metadata ?? {}) as { childId?: unknown; householdId?: unknown };
  if (typeof meta.childId !== "string" || typeof meta.householdId !== "string") return null;

  const [c] = await db.select().from(childProfile).where(eq(childProfile.id, meta.childId)).limit(1);
  // The child must still exist and belong to the household the key was issued for.
  if (!c || c.householdId !== meta.householdId) return null;
  return { childId: c.id, householdId: c.householdId, ageBand: c.ageBand, locale: c.locale, keyId: result.key.id };
}

export async function getChild(): Promise<ChildContext | null> {
  return verifyChildKey((await cookies()).get(CHILD_DEVICE_COOKIE)?.value);
}
