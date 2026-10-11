import { timingSafeEqual } from "node:crypto";
import { type NextRequest } from "next/server";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { proxyTurn } from "@/child/voice";
import { env } from "@/platform/env";
import { companionTurn, conversationOf } from "@/safety/voice";
import type { ToolCall } from "@/safety/voice-agent/tools";
import type { SafetyCtx } from "@/safety/types";

// The safety proxy the ElevenLabs agent calls as its "custom LLM" (ARCHITECTURE §4.3, D-003, D-068). It
// speaks the OpenAI Chat Completions streaming format, and every word goes through safety/ (CLAUDE.md
// rule 1). Each turn is bound to a voice session our gate issued (child/voice.ts), by its id passed
// through ElevenLabs in elevenlabs_extra_body; age band, locale, place and time left come from our
// database, never from the request. Without a live session it says one kind goodbye line and ends the call.
//
// The Milestone 2 spike (adult-only, no child, VOICE_SPIKE_ENABLED=1) still answers when no session
// matches, for the latency scripts.

export const runtime = "nodejs";
export const maxDuration = 30;

const LINES = { en: en.child.talk, ar: ar.child.talk };

function authorised(request: NextRequest): boolean {
  const secret = env().VOICE_PROXY_SECRET;
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const e = env();
  if (!e.VOICE_ENABLED && !e.VOICE_SPIKE_ENABLED) return new Response("Not found", { status: 404 });
  if (!authorised(request)) return new Response("Unauthorized", { status: 401 });

  let body: { messages?: { role: string; content: unknown }[]; tools?: { function?: { name?: string } }[]; elevenlabs_extra_body?: { feelio_session?: unknown } };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const messages = conversationOf(body.messages ?? []);
  const offered = new Set((body.tools ?? []).map((t) => t.function?.name).filter(Boolean));

  const extra = body.elevenlabs_extra_body?.feelio_session;
  const sessionId = typeof extra === "string" ? extra : null;
  const turn = e.VOICE_ENABLED ? await proxyTurn({ sessionId, conversationId: request.headers.get("x-feelio-conversation") }) : ({ ok: false } as const);
  if (process.env.NODE_ENV !== "production") {
    // Development only, and never any words: whether a session matched and which tools ElevenLabs offered.
    console.info(`[voice] session=${turn.ok ? "bound" : sessionId ? "unknown" : "missing"} tools=${[...offered].join(",")}`);
  }

  const spike = !turn.ok && e.VOICE_SPIKE_ENABLED;
  const locale = turn.ok ? turn.ctx.locale : request.headers.get("x-feelio-locale") === "ar" ? "ar" : "en";

  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const chunk = (delta: Record<string, unknown>, finish: string | null = null) =>
    `data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: "feelio-safety", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;
  let toolIndex = 0;
  // A client tool (or end_call) as one complete OpenAI tool-call delta. Only names the agent offered.
  const toolChunk = (name: string, args: Record<string, unknown>) =>
    offered.has(name)
      ? chunk({ tool_calls: [{ index: toolIndex++, id: `call_${crypto.randomUUID().slice(0, 12)}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] })
      : "";

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (s: string) => s && controller.enqueue(enc.encode(s));
      send(chunk({ role: "assistant" }));
      const finish = () => {
        send(chunk({}, toolIndex ? "tool_calls" : "stop"));
        send("data: [DONE]\n\n");
        controller.close();
      };

      // No live session (or its time is up): one fixed, kind line, then the call ends. No model at all.
      if ((!turn.ok && !spike) || (turn.ok && turn.stop)) {
        send(chunk({ content: LINES[locale].goodbye + " " }));
        send(toolChunk("end_call", { reason: "time_up" }));
        return finish();
      }
      if (!messages.length || messages[messages.length - 1].role !== "user") return finish();

      const ctx: SafetyCtx = turn.ok
        ? turn.ctx
        : { childId: null, householdId: null, ageBand: "7-9", locale, feature: "voice", market: e.DEFAULT_MARKET };
      try {
        const events = companionTurn(ctx, messages, turn.ok
          ? {
              // D-068: the faster output check only for the owner's adult tests; strict (D-018) for children.
              outputCheck: turn.session.adultTest ? "gated" : "strict",
              countAs: turn.session.adultTest ? "test" : undefined,
              context: turn.context,
              tools: true,
            }
          : { countAs: "test" });
        const tools: ToolCall[] = [];
        for await (const ev of events) {
          if (ev.type === "say") send(chunk({ content: ev.text + " " }));
          // Crisis: the router (never the model) shows who can help, and calms the mascot.
          if (ev.type === "crisis") {
            tools.push({ name: "show_safety_resources", args: { kinds: ev.resources.map((r) => r.kind) } });
            tools.push({ name: "set_mascot_state", args: { mood: ev.mascot === "empathy" ? "empathy" : "calm" } });
          }
          // A place suggestion only for a place this child can reach (the server's world state).
          if (ev.type === "tool" && !(ev.call.name === "suggest_place" && turn.ok && !turn.context.placesOpen?.includes(ev.call.args.place))) tools.push(ev.call);
          if (ev.type === "end") {
            const t = ev.timings;
            send(`: feelio ${ev.reason} t0=${t.t0Ms.toFixed(0)} t1=${t.t1Ms?.toFixed(0)} first_token=${t.firstTokenMs?.toFixed(0)} first_release=${t.firstReleaseMs?.toFixed(0)} total=${t.totalMs.toFixed(0)}\n\n`);
          }
        }
        for (const c of tools) send(toolChunk(c.name, c.args));
      } catch {
        // Never an error to the child: the pipeline already falls back; this is a last resort.
        send(chunk({ content: LINES[locale].trouble + " " }));
      }
      finish();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
