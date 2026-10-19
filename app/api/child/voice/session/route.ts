import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChild } from "@/auth/guards";
import { GAME_STATUS } from "@/child/gameMemory";
import { bindConversation, endVoiceSession, reportGame, startVoiceSession, type VoiceRefusal } from "@/child/voice";
import { ACTIVITIES } from "@/safety/voice-agent/tools";
import { env } from "@/platform/env";
import { WORLD_PLACE_IDS } from "@/design/asset-ids";

// Child scope: the voice session gate (ARCHITECTURE §4.1, D-068). Every check runs on the server
// (child/voice.ts). The client sends only ids; it never chooses its age band, locale or time.
const body = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("start"), placeId: z.enum(WORLD_PLACE_IDS).optional(), purpose: z.enum(["talk", "story"]).optional() }),
  z.strictObject({ action: z.literal("bind"), sessionId: z.uuid(), conversationId: z.string().regex(/^[A-Za-z0-9_-]{4,128}$/) }),
  z.strictObject({ action: z.literal("end"), sessionId: z.uuid() }),
  // The game the child is playing during the talk (D-077): closed lists and small numbers only.
  z.strictObject({
    action: z.literal("game"),
    sessionId: z.uuid(),
    activity: z.enum(ACTIVITIES),
    step: z.number().int().min(0).max(20),
    status: z.enum(GAME_STATUS),
    found: z.number().int().min(0).max(10),
  }),
]);

const STATUS: Record<VoiceRefusal, number> = {
  off: 503,
  not_approved: 403,
  talk_off: 403,
  time_up: 403,
  outside_hours: 403,
  voice_time_up: 403,
  busy: 409,
  unavailable: 503,
};

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const child = await getChild();
  if (!child) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const b = parsed.data;

  if (b.action === "start") {
    const r = await startVoiceSession(child, { placeId: b.placeId, purpose: b.purpose });
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: STATUS[r.reason] });
    return NextResponse.json(r, { headers: { "cache-control": "no-store" } });
  }
  if (b.action === "bind") {
    const ok = await bindConversation(child, b.sessionId, b.conversationId);
    return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
  }
  if (b.action === "game") {
    const ok = await reportGame(child, b.sessionId, { activity: b.activity, step: b.step, status: b.status, found: b.found });
    return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
  }
  await endVoiceSession(child, b.sessionId);
  return NextResponse.json({ ok: true });
}
