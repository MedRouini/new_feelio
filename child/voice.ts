import "server-only";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import type { ChildContext } from "@/auth/guards";
import { db } from "@/platform/db/client";
import { childProfile, childSettings, household, usageLedger, voiceSession } from "@/platform/db/schema";
import { env } from "@/platform/env";
import { localDay, safeZone } from "@/platform/time";
import type { CompanionContext } from "@/safety/prompts";
import type { SafetyCtx } from "@/safety/types";
import { conversationToken, voiceConfigured } from "@/safety/voice-agent/provider";
import { nicknameWord } from "./options";
import { getWorldState } from "./progress";
import { pauseFor, secondsToday } from "./usage";

// The voice session gate (ARCHITECTURE §4.1, D-068), child scope, server-only. A voice session starts
// only here, after every check passes on the server (CR-2): voice switched on, the provider approval
// flag (adult testing until ElevenLabs approves use by children, D-005), Talk allowed by the parent,
// allowed hours and today's time, the daily voice minutes, and one session at a time. The agent
// requires a token we mint, so there is no other way in. The proxy then binds every turn to this
// row, and re-checks time on every turn.

/** One talk lasts at most this long (the agent's own backstop is longer). */
export const MAX_SESSION_S = 240;
/** Too little time left to start a talk: rest instead. */
const MIN_SESSION_S = 30;
/** A session nobody ended counts as open until its time runs out, plus this grace. */
const GRACE_S = 30;

export type VoiceRefusal = "off" | "not_approved" | "talk_off" | "time_up" | "outside_hours" | "voice_time_up" | "busy" | "unavailable";

type Session = typeof voiceSession.$inferSelect;

function usedSeconds(s: Session, now: Date): number {
  const end = s.endedAt ?? now;
  return Math.max(0, Math.min(s.allowedSeconds, Math.round((end.getTime() - s.startedAt.getTime()) / 1000)));
}

function isOpen(s: Session, now: Date): boolean {
  return !s.endedAt && now.getTime() < s.startedAt.getTime() + (s.allowedSeconds + GRACE_S) * 1000;
}

async function zoneOf(childId: string): Promise<string> {
  const [r] = await db
    .select({ zone: household.timezone })
    .from(childProfile)
    .innerJoin(household, eq(household.id, childProfile.householdId))
    .where(eq(childProfile.id, childId))
    .limit(1);
  return safeZone(r?.zone);
}

/** This child's sessions from the last 36 hours (covers the family's whole current day). */
async function recentSessions(childId: string, now: Date): Promise<Session[]> {
  return db
    .select()
    .from(voiceSession)
    .where(and(eq(voiceSession.childId, childId), gte(voiceSession.startedAt, new Date(now.getTime() - 36 * 3600_000))))
    .orderBy(desc(voiceSession.startedAt));
}

/** Seconds of voice used on the family's current day. */
export async function voiceSecondsToday(childId: string, now = new Date()): Promise<number> {
  const zone = await zoneOf(childId);
  const today = localDay(now, zone);
  return (await recentSessions(childId, now)).filter((s) => localDay(s.startedAt, zone) === today).reduce((n, s) => n + usedSeconds(s, now), 0);
}

export async function startVoiceSession(
  child: ChildContext,
  opts: { placeId?: string | null } = {},
  now = new Date(),
): Promise<{ ok: true; token: string; sessionId: string; allowedSeconds: number } | { ok: false; reason: VoiceRefusal }> {
  const e = env();
  if (!e.VOICE_ENABLED || !voiceConfigured()) return { ok: false, reason: "off" };
  // D-005: ElevenLabs hasn't approved use by children; until then only the owner tests, through a child profile.
  if (!e.VOICE_ADULT_TESTING) return { ok: false, reason: "not_approved" };

  const [s] = await db.select().from(childSettings).where(eq(childSettings.childId, child.childId)).limit(1);
  if (!s?.features.talk) return { ok: false, reason: "talk_off" };
  const pause = await pauseFor(child.childId, now);
  if (pause) return { ok: false, reason: pause.reason };

  const sessions = await recentSessions(child.childId, now);
  if (sessions.some((x) => isOpen(x, now))) return { ok: false, reason: "busy" };
  const zone = await zoneOf(child.childId);
  const today = localDay(now, zone);
  const voiceUsed = sessions.filter((x) => localDay(x.startedAt, zone) === today).reduce((n, x) => n + usedSeconds(x, now), 0);
  const voiceLeft = s.voiceDailyMinutes * 60 - voiceUsed;
  const appLeft = s.dailyMinutes * 60 - (await secondsToday(child.childId, now));
  const allowedSeconds = Math.min(MAX_SESSION_S, voiceLeft, appLeft);
  if (allowedSeconds < MIN_SESSION_S) return { ok: false, reason: voiceLeft < MIN_SESSION_S ? "voice_time_up" : "time_up" };

  let token: Awaited<ReturnType<typeof conversationToken>>;
  try {
    token = await conversationToken();
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  const [row] = await db
    .insert(voiceSession)
    .values({
      childId: child.childId,
      householdId: child.householdId,
      // Until the live client reports the real id, the row is bound by a placeholder that never matches.
      conversationId: token.conversationId ?? `pending:${crypto.randomUUID()}`,
      ageBand: child.ageBand,
      locale: child.locale,
      placeId: opts.placeId ?? null,
      allowedSeconds,
      adultTest: e.VOICE_ADULT_TESTING,
      startedAt: now,
    })
    .returning({ id: voiceSession.id });
  return { ok: true, token: token.token, sessionId: row.id, allowedSeconds };
}

/**
 * Binds a session to the conversation ElevenLabs actually started (the client reports it once
 * connected), in case it differs from the id the token came with. Only this child's own open session.
 */
export async function bindConversation(child: ChildContext, sessionId: string, conversationId: string, now = new Date()): Promise<boolean> {
  const [s] = await db
    .select()
    .from(voiceSession)
    .where(and(eq(voiceSession.id, sessionId), eq(voiceSession.childId, child.childId), isNull(voiceSession.endedAt)))
    .limit(1);
  if (!s || !isOpen(s, now)) return false;
  if (s.conversationId === conversationId) return true;
  try {
    // The unique index refuses an id already bound to another session.
    await db.update(voiceSession).set({ conversationId }).where(eq(voiceSession.id, s.id));
    return true;
  } catch {
    return false;
  }
}

/** Ends this child's session (idempotent) and records its seconds in the usage ledger (cost tracking). */
export async function endVoiceSession(child: ChildContext, sessionId: string, now = new Date()): Promise<void> {
  const [s] = await db.select().from(voiceSession).where(and(eq(voiceSession.id, sessionId), eq(voiceSession.childId, child.childId))).limit(1);
  if (!s || s.endedAt) return;
  const ended = await db
    .update(voiceSession)
    .set({ endedAt: now })
    .where(and(eq(voiceSession.id, s.id), isNull(voiceSession.endedAt)))
    .returning({ id: voiceSession.id });
  if (!ended.length) return;
  const seconds = usedSeconds({ ...s, endedAt: now }, now);
  await db.insert(usageLedger).values({ childId: s.childId, householdId: s.householdId, day: localDay(now, await zoneOf(s.childId)), feature: "voice", seconds, createdAt: now });
}

export type ProxyTurn =
  | { ok: false }
  | { ok: true; stop: "time_up" | null; session: Session; ctx: SafetyCtx; context: CompanionContext; secondsLeft: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * What the proxy needs for one turn, from our database only: the session, whether time is up, the
 * safety context, and what Feelio may know about the child. The session is found by the id our gate
 * issued, which the app passes through ElevenLabs as `elevenlabs_extra_body.feelio_session` (the
 * request-header variable is sent unsubstituted, seen in the M5 live test), or by the conversation id.
 * Only an open session answers; it carries nothing the child could choose.
 */
export async function proxyTurn(by: { sessionId?: string | null; conversationId?: string | null }, now = new Date()): Promise<ProxyTurn> {
  const where = by.sessionId && UUID.test(by.sessionId) ? eq(voiceSession.id, by.sessionId) : by.conversationId && /^conv_[A-Za-z0-9]+$/.test(by.conversationId) ? eq(voiceSession.conversationId, by.conversationId) : null;
  if (!where) return { ok: false };
  const [s] = await db.select().from(voiceSession).where(where).limit(1);
  if (!s || s.endedAt || !isOpen(s, now)) return { ok: false };

  const secondsLeft = s.allowedSeconds - usedSeconds(s, now);
  const [p] = await db.select().from(childProfile).where(eq(childProfile.id, s.childId)).limit(1);
  if (!p) return { ok: false };
  const paused = await pauseFor(s.childId, now);
  const world = await getWorldState(s.childId);
  const places = Object.entries(world.places).filter(([, v]) => v.state !== "locked");

  const ctx: SafetyCtx = {
    childId: s.childId,
    householdId: s.householdId,
    ageBand: s.ageBand,
    locale: s.locale,
    feature: "voice",
    market: env().DEFAULT_MARKET,
    sessionId: s.id,
    placeId: s.placeId ?? undefined,
  };
  const context: CompanionContext = {
    // Only a word from the reviewed list: the parent's typed nickname never goes to a model.
    name: p.nicknameKey && p.nicknameKey !== "parent" ? nicknameWord(p.nicknameKey, p.locale) : null,
    interests: (p.interests ?? []) as string[],
    placesOpen: places.map(([id]) => id),
    levelsDone: places.reduce((n, [, v]) => n + v.completedCount, 0),
    secondsLeft,
  };
  return { ok: true, stop: secondsLeft <= 5 || paused ? "time_up" : null, session: s, ctx, context, secondsLeft };
}
