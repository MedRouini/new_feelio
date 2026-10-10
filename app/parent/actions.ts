"use server";

import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth/server";
import { checkParent, passAdultGate, type GateLevel, type ParentCheck } from "@/auth/guards";
import { LOCALE_COOKIE, isLocale } from "@/i18n/request";
import { db } from "@/platform/db/client";
import { adultGate, session as sessionTable } from "@/platform/db/schema";
import {
  createChild,
  deleteAccount,
  deleteChild,
  recordConsentAndCreateHousehold,
  revokeDevice,
  updateSettings,
} from "@/parent/operations";
import { dashboardRedirect as redirect } from "./page-guard";

// Every action re-checks authorisation itself (server actions are reachable by direct POST).


function safeNext(v: FormDataEntryValue | null, fallback = "/"): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

function bounce(check: Exclude<ParentCheck, { ok: true }>, next: string, level: GateLevel = "area"): never {
  if (check.reason === "signed_out") redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (check.reason === "gate_required") redirect(`/gate?level=${level}&next=${encodeURIComponent(next)}`);
  redirect("/consent");
}

/** The parent just typed their password: record the adult-gate pass for the new session. */
async function recordGateForToken(token: string | undefined, userId: string) {
  if (!token) return;
  const [s] = await db.select({ id: sessionTable.id }).from(sessionTable).where(eq(sessionTable.token, token)).limit(1);
  if (s) {
    await db
      .insert(adultGate)
      .values({ sessionId: s.id, userId, passedAt: new Date() })
      .onConflictDoUpdate({ target: adultGate.sessionId, set: { passedAt: new Date() } });
  }
}

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  password: z.string().min(10).max(200),
  ageConfirm: z.literal("on"),
});

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/sign-up?error=invalid");
  let ok = false;
  try {
    const res = await auth.api.signUpEmail({
      body: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
    await recordGateForToken(res.token ?? undefined, res.user.id);
    ok = true;
  } catch {
    ok = false;
  }
  redirect(ok ? "/consent" : "/sign-up?error=failed");
}

const signInSchema = z.object({ email: z.email(), password: z.string().min(1).max(200) });

export async function signInAction(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/sign-in?error=1&next=${encodeURIComponent(next)}`);
  let ok = false;
  try {
    const res = await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    await recordGateForToken(res.token, res.user.id);
    ok = true;
  } catch {
    ok = false;
  }
  redirect(ok ? next : `/sign-in?error=1&next=${encodeURIComponent(next)}`);
}

export async function signOutAction() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // already signed out
  }
  redirect("/sign-in");
}

export async function gateAction(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const level = formData.get("level") === "sensitive" ? "sensitive" : "area";
  const password = formData.get("password");
  const ok = typeof password === "string" && password.length > 0 && (await passAdultGate(password));
  redirect(ok ? next : `/gate?error=1&level=${level}&next=${encodeURIComponent(next)}`);
}

export async function consentAction(formData: FormData) {
  const check = await checkParent({ gate: "area" });
  if (!check.ok) bounce(check, "/consent");
  if (check.parent.householdId) redirect("/");
  if (formData.get("agree") !== "on") redirect("/consent?error=1");
  const loc = formData.get("locale");
  const tz = formData.get("timezone");
  await recordConsentAndCreateHousehold({
    userId: check.parent.userId,
    locale: isLocale(loc) ? loc : "en",
    timezone: typeof tz === "string" && /^[A-Za-z_]+(\/[A-Za-z_+-]+)*$/.test(tz) ? tz : "UTC",
  });
  redirect("/");
}

const childSchema = z.object({
  nickname: z.string().trim().max(30).optional().default(""),
  ageBand: z.enum(["5-6", "7-9", "10-12"]),
  locale: z.enum(["en", "ar"]),
});

export async function createChildAction(formData: FormData) {
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) bounce(check, "/children/new");
  const parsed = childSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/children/new?error=1");
  const id = await createChild({
    userId: check.parent.userId,
    householdId: check.parent.householdId!,
    nickname: parsed.data.nickname || null,
    ageBand: parsed.data.ageBand,
    locale: parsed.data.locale,
  });
  redirect(`/children/${id}/settings?setup=1`);
}

const settingsSchema = z.object({
  childId: z.string().min(1),
  talk: z.literal("on").optional(),
  stories: z.literal("on").optional(),
  sound: z.literal("on").optional(),
  dailyMinutes: z.enum(["15", "30", "45"]),
  setup: z.literal("1").optional(),
});

export async function updateSettingsAction(formData: FormData) {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/");
  const { childId, setup } = parsed.data;
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) bounce(check, `/children/${childId}/settings`);
  await updateSettings({
    userId: check.parent.userId,
    householdId: check.parent.householdId!,
    childId,
    s: {
      talk: parsed.data.talk === "on",
      stories: parsed.data.stories === "on",
      sound: parsed.data.sound === "on",
      dailyMinutes: Number(parsed.data.dailyMinutes) as 15 | 30 | 45,
    },
  });
  redirect(setup ? `/children/${childId}?setup=1` : `/children/${childId}`);
}

export async function deleteChildAction(formData: FormData) {
  const childId = String(formData.get("childId") ?? "");
  const check = await checkParent({ gate: "sensitive", needHousehold: true });
  if (!check.ok) bounce(check, `/children/${childId}`, "sensitive");
  await deleteChild({ userId: check.parent.userId, householdId: check.parent.householdId!, childId });
  redirect("/");
}

export async function revokeDeviceAction(formData: FormData) {
  const keyId = String(formData.get("keyId") ?? "");
  const back = safeNext(formData.get("next"));
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) bounce(check, back);
  await revokeDevice({ userId: check.parent.userId, householdId: check.parent.householdId!, keyId });
  redirect(back);
}

export async function deleteAccountAction() {
  const check = await checkParent({ gate: "sensitive" });
  if (!check.ok) bounce(check, "/account", "sensitive");
  // Deleting the user cascades to its sessions, so the session cookie stops working immediately.
  await deleteAccount(check.parent.userId);
  redirect("/sign-in");
}

export async function setLocaleAction(formData: FormData) {
  const loc = formData.get("locale");
  if (isLocale(loc)) {
    (await cookies()).set(LOCALE_COOKIE, loc, { sameSite: "lax", path: "/", maxAge: 365 * 24 * 60 * 60 });
  }
  redirect(safeNext(formData.get("next")));
}
