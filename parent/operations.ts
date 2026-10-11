import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth/server";
import { CHILD_DEVICE_CONFIG_ID, CHILD_PERMISSIONS } from "@/auth/constants";
import { db } from "@/platform/db/client";
import { apikey, auditLog, childProfile, childSettings, consentRecord, household, user, type ScheduleWindow } from "@/platform/db/schema";
import { decryptField, encryptField } from "@/platform/crypto";
import { env } from "@/platform/env";
import { getMarket } from "@/platform/markets";
import { isValidWindow, isValidZone } from "@/platform/time";

// Parent-scope operations. Callers must have passed checkParent(); each function also takes the
// parent's ids explicitly and scopes every query to that household (no cross-household access).

export type AgeBand = "5-6" | "7-9" | "10-12";
export type Locale = "en" | "ar";

export async function recordConsentAndCreateHousehold(p: { userId: string; locale: Locale; timezone: string }) {
  const market = getMarket(env().DEFAULT_MARKET);
  const householdId = crypto.randomUUID();
  await db.batch([
    db.insert(household).values({ id: householdId, ownerUserId: p.userId, market: market.id, locale: p.locale, timezone: p.timezone }),
    db.insert(consentRecord).values({
      householdId,
      userId: p.userId,
      policyVersion: market.consent.policyVersion,
      market: market.id,
      method: market.consent.method,
      scopes: market.consent.scopes,
    }),
    db.insert(auditLog).values({ householdId, userId: p.userId, action: "consent.given", detail: { policyVersion: market.consent.policyVersion } }),
  ]);
  return householdId;
}

export async function hasActiveConsent(householdId: string): Promise<boolean> {
  const market = getMarket(env().DEFAULT_MARKET);
  const rows = await db
    .select({ v: consentRecord.policyVersion, w: consentRecord.withdrawnAt })
    .from(consentRecord)
    .where(eq(consentRecord.householdId, householdId));
  return rows.some((r) => r.v === market.consent.policyVersion && r.w === null);
}

export async function createChild(p: { userId: string; householdId: string; nickname: string | null; ageBand: AgeBand; locale: Locale }) {
  if (!(await hasActiveConsent(p.householdId))) throw new Error("Consent required before creating a child profile");
  const childId = crypto.randomUUID();
  const nick = p.nickname?.trim();
  await db.batch([
    db.insert(childProfile).values({
      id: childId,
      householdId: p.householdId,
      nicknameEnc: nick ? encryptField(nick.slice(0, 30)) : null,
      ageBand: p.ageBand,
      locale: p.locale,
    }),
    db.insert(childSettings).values({ childId }),
    db.insert(auditLog).values({ householdId: p.householdId, userId: p.userId, action: "child.created", detail: { childId, ageBand: p.ageBand } }),
  ]);
  return childId;
}

export async function listChildren(householdId: string) {
  const rows = await db.select().from(childProfile).where(eq(childProfile.householdId, householdId));
  return rows.map((c) => ({
    id: c.id,
    nickname: c.nicknameEnc ? decryptField(c.nicknameEnc) : null,
    ageBand: c.ageBand,
    locale: c.locale,
    createdAt: c.createdAt,
  }));
}

export async function getChildInHousehold(householdId: string, childId: string) {
  const [c] = await db
    .select()
    .from(childProfile)
    .where(and(eq(childProfile.id, childId), eq(childProfile.householdId, householdId)))
    .limit(1);
  return c ?? null;
}

/** Issues a device key for one child. The plaintext key is returned once and never stored. */
export async function createDeviceKey(p: { userId: string; householdId: string; childId: string; label: string }) {
  if (!(await getChildInHousehold(p.householdId, p.childId))) throw new Error("Child not found in household");
  const created = await auth.api.createApiKey({
    body: {
      userId: p.userId,
      configId: CHILD_DEVICE_CONFIG_ID,
      name: p.label.slice(0, 32) || "Device",
      permissions: { child: [...CHILD_PERMISSIONS.child] },
      metadata: { childId: p.childId, householdId: p.householdId },
    },
  });
  await db.insert(auditLog).values({ householdId: p.householdId, userId: p.userId, action: "device.created", detail: { childId: p.childId, keyId: created.id } });
  return { key: created.key, id: created.id };
}

type KeyMeta = { childId?: string; householdId?: string };

function parseMeta(raw: string | null): KeyMeta {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return typeof v === "string" ? (JSON.parse(v) as KeyMeta) : (v as KeyMeta);
  } catch {
    return {};
  }
}

export async function listDevices(p: { userId: string; householdId: string }) {
  const rows = await db
    .select({ id: apikey.id, name: apikey.name, start: apikey.start, createdAt: apikey.createdAt, expiresAt: apikey.expiresAt, lastRequest: apikey.lastRequest, enabled: apikey.enabled, metadata: apikey.metadata })
    .from(apikey)
    .where(and(eq(apikey.referenceId, p.userId), eq(apikey.configId, CHILD_DEVICE_CONFIG_ID)));
  return rows
    .map((r) => ({ ...r, meta: parseMeta(r.metadata) }))
    .filter((r) => r.meta.householdId === p.householdId)
    .map(({ metadata: _m, ...r }) => r);
}

export async function revokeDevice(p: { userId: string; householdId: string; keyId: string }) {
  const own = (await listDevices(p)).some((d) => d.id === p.keyId);
  if (!own) throw new Error("Device not found");
  await db.delete(apikey).where(and(eq(apikey.id, p.keyId), eq(apikey.referenceId, p.userId)));
  await db.insert(auditLog).values({ householdId: p.householdId, userId: p.userId, action: "device.revoked", detail: { keyId: p.keyId } });
}

/** Hard delete of a child: profile, settings, progress, usage and its device keys (CR-6). */
export async function deleteChild(p: { userId: string; householdId: string; childId: string }) {
  if (!(await getChildInHousehold(p.householdId, p.childId))) throw new Error("Child not found in household");
  const keyIds = (await listDevices(p)).filter((d) => d.meta.childId === p.childId).map((d) => d.id);
  if (keyIds.length) await db.delete(apikey).where(inArray(apikey.id, keyIds));
  await db.batch([
    db.delete(childProfile).where(and(eq(childProfile.id, p.childId), eq(childProfile.householdId, p.householdId))),
    db.insert(auditLog).values({ householdId: p.householdId, userId: p.userId, action: "child.deleted", detail: { childId: p.childId } }),
  ]);
}

/**
 * Hard delete of the whole account: device keys (no FK, so explicit), then the user row, which
 * cascades to sessions, household, consent, children, settings, progress, usage and audit log.
 */
export async function deleteAccount(userId: string) {
  await db.batch([db.delete(apikey).where(eq(apikey.referenceId, userId)), db.delete(user).where(eq(user.id, userId))]);
}

export type SettingsInput = {
  talk: boolean;
  stories: boolean;
  /** Adventures (the levels on the map). Kept as it is when not given. */
  scenarios?: boolean;
  dailyMinutes: 15 | 30 | 45;
  sound: boolean;
  /** Allowed hours in the family's time zone (D-065). Kept as they are when not given. */
  schedule?: ScheduleWindow[];
};

export async function getSettings(householdId: string, childId: string) {
  if (!(await getChildInHousehold(householdId, childId))) return null;
  const [row] = await db.select().from(childSettings).where(eq(childSettings.childId, childId)).limit(1);
  return row ?? null;
}

/** Parent settings for one child. Enforced on the server wherever a feature is used (CR-2). */
export async function updateSettings(p: { userId: string; householdId: string; childId: string; s: SettingsInput }) {
  const current = await getSettings(p.householdId, p.childId);
  if (!current) throw new Error("Child not found in household");
  await db.batch([
    db
      .update(childSettings)
      .set({
        features: { ...current.features, talk: p.s.talk, stories: p.s.stories, scenarios: p.s.scenarios ?? current.features.scenarios },
        ...(p.s.schedule ? { schedule: p.s.schedule.filter(isValidWindow) } : {}),
        dailyMinutes: p.s.dailyMinutes,
        sound: p.s.sound,
        updatedAt: new Date(),
      })
      .where(eq(childSettings.childId, p.childId)),
    db.insert(auditLog).values({ householdId: p.householdId, userId: p.userId, action: "settings.updated", detail: { childId: p.childId, ...p.s } }),
  ]);
}

/** The family's time zone (D-065): validated against the IANA list by Luxon, audited. */
export async function updateHouseholdTimezone(p: { userId: string; householdId: string; timezone: string }) {
  if (!isValidZone(p.timezone)) throw new Error("Unknown time zone");
  await db.batch([
    db.update(household).set({ timezone: p.timezone }).where(eq(household.id, p.householdId)),
    db.insert(auditLog).values({ householdId: p.householdId, userId: p.userId, action: "household.timezone", detail: { timezone: p.timezone } }),
  ]);
}

export async function getHousehold(householdId: string) {
  const [h] = await db.select().from(household).where(eq(household.id, householdId)).limit(1);
  return h ?? null;
}
