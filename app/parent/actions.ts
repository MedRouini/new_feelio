"use server";

import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth/server";
import { checkParent, passAdultGate, type GateLevel, type ParentCheck } from "@/auth/guards";
import { LOCALE_COOKIE, isLocale } from "@/i18n/request";
import { db } from "@/platform/db/client";
import { adultGate, PARENT_REPORT_CATEGORIES, session as sessionTable } from "@/platform/db/schema";
import { isValidTime, isValidWindow, isValidZone, safeZone } from "@/platform/time";
import {
  createChild,
  deleteAccount,
  deleteChild,
  recordConsentAndCreateHousehold,
  revokeDevice,
  updateHouseholdTimezone,
  updateSettings,
} from "@/parent/operations";
import { createParentReport } from "@/parent/insights";
import { isSafetyLead, reviewEvent, reviewReport } from "@/parent/safety-lead";
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
    timezone: safeZone(typeof tz === "string" ? tz : null),
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
  scenarios: z.literal("on").optional(),
  sound: z.literal("on").optional(),
  dailyMinutes: z.enum(["15", "30", "45"]),
  // Allowed hours (D-065): one window, the same times on the chosen days, in the family's time zone.
  start: z.string().refine(isValidTime),
  end: z.string().refine((v) => v === "24:00" || isValidTime(v)),
  setup: z.literal("1").optional(),
});

export async function updateSettingsAction(formData: FormData) {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  const days = [...new Set(formData.getAll("day").map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
  const window = parsed.success ? { days, start: parsed.data.start, end: parsed.data.end } : null;
  const childId = String(formData.get("childId") ?? "");
  if (!parsed.success || !window || !isValidWindow(window)) redirect(childId ? `/children/${childId}/settings?error=hours` : "/");
  const { setup } = parsed.data;
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) bounce(check, `/children/${childId}/settings`);
  await updateSettings({
    userId: check.parent.userId,
    householdId: check.parent.householdId!,
    childId,
    s: {
      talk: parsed.data.talk === "on",
      stories: parsed.data.stories === "on",
      scenarios: parsed.data.scenarios === "on",
      sound: parsed.data.sound === "on",
      dailyMinutes: Number(parsed.data.dailyMinutes) as 15 | 30 | 45,
      schedule: [window],
    },
  });
  redirect(setup ? `/children/${childId}/devices?setup=1` : `/children/${childId}/settings?saved=1`);
}

export async function updateTimezoneAction(formData: FormData) {
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) bounce(check, "/account");
  const zone = String(formData.get("timezone") ?? "");
  if (!isValidZone(zone)) redirect("/account?error=timezone");
  await updateHouseholdTimezone({ userId: check.parent.userId, householdId: check.parent.householdId!, timezone: zone });
  redirect("/account?saved=timezone");
}

export async function deleteChildAction(formData: FormData) {
  const childId = String(formData.get("childId") ?? "");
  const check = await checkParent({ gate: "sensitive", needHousehold: true });
  if (!check.ok) bounce(check, `/children/${childId}/settings`, "sensitive");
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

const reportSchema = z.object({
  childId: z.string().optional(),
  category: z.enum(PARENT_REPORT_CATEGORIES),
  note: z.string().max(500).optional().default(""),
});

/** "Something felt wrong" (SR-43): a parent's report goes to the safety lead's review queue. */
export async function createReportAction(formData: FormData) {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  const childId = parsed.success && parsed.data.childId ? parsed.data.childId : null;
  const back = childId ? `/children/${childId}/safety` : "/";
  if (!parsed.success) redirect(`${back}?report=error`);
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) bounce(check, back);
  await createParentReport({ userId: check.parent.userId, householdId: check.parent.householdId!, childId, category: parsed.data.category, note: parsed.data.note });
  redirect(`${back}?report=sent`);
}

/** Safety lead only: mark an event reviewed, optionally escalating it (kept past retention while handled). */
export async function reviewEventAction(formData: FormData) {
  const check = await checkParent({ gate: "sensitive" });
  if (!check.ok) bounce(check, "/safety", "sensitive");
  if (!isSafetyLead(check.parent.userId)) redirect("/");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  await reviewEvent(id, check.parent.userId, decision === "escalate" ? { escalate: true } : {});
  redirect("/safety");
}

export async function reviewReportAction(formData: FormData) {
  const check = await checkParent({ gate: "sensitive" });
  if (!check.ok) bounce(check, "/safety", "sensitive");
  if (!isSafetyLead(check.parent.userId)) redirect("/");
  await reviewReport(String(formData.get("id") ?? ""), check.parent.userId);
  redirect("/safety");
}
