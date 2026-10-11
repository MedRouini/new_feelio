import { timingSafeEqual } from "node:crypto";
import { type NextRequest } from "next/server";
import { env } from "@/platform/env";
import { companionTurn, conversationOf } from "@/safety/voice";
import type { SafetyCtx } from "@/safety/types";

// The safety proxy the ElevenLabs agent calls as its "custom LLM" (ARCHITECTURE §4.3, D-003). It speaks
// the OpenAI Chat Completions streaming format, and every word goes through safety/ (CLAUDE.md rule 1).
//
// MILESTONE 2 SPIKE, ADULT-ONLY (D-005, D-061): off unless VOICE_SPIKE_ENABLED=1, and not bound to any
// child. The age band and locale here are test settings. In Milestone 5 the session gate binds each
// call to a voice session in our database (child, age band, locale, time left), never to client data.

export const runtime = "nodejs";
export const maxDuration = 30;

function authorised(request: NextRequest): boolean {
  const secret = env().VOICE_PROXY_SECRET;
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!env().VOICE_SPIKE_ENABLED) return new Response("Not found", { status: 404 });
  if (!authorised(request)) return new Response("Unauthorized", { status: 401 });

  let body: { messages?: { role: string; content: unknown }[] };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const messages = conversationOf(body.messages ?? []);
  if (!messages.length || messages[messages.length - 1].role !== "user") return new Response("Bad request", { status: 400 });

  const locale = request.headers.get("x-feelio-locale") === "ar" ? "ar" : "en";
  // Spike context: adult testers, no child id. Statistics are counted as "test", never as real voice use.
  const ctx: SafetyCtx = { childId: null, householdId: null, ageBand: "7-9", locale, feature: "voice", market: env().DEFAULT_MARKET };

  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const chunk = (delta: Record<string, unknown>, finish: string | null = null) =>
    `data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: "feelio-safety", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (s: string) => controller.enqueue(enc.encode(s));
      send(chunk({ role: "assistant" }));
      try {
        for await (const ev of companionTurn(ctx, messages, { countAs: "test" })) {
          if (ev.type === "say") send(chunk({ content: ev.text + " " }));
          // Crisis display and mascot mood go to the app through client tools in Milestone 5
          // (whether a custom LLM can emit them is still to be verified, D-004). The words are already safe.
          if (ev.type === "end") {
            const t = ev.timings;
            send(`: feelio ${ev.reason} t0=${t.t0Ms.toFixed(0)} t1=${t.t1Ms?.toFixed(0)} first_token=${t.firstTokenMs?.toFixed(0)} first_release=${t.firstReleaseMs?.toFixed(0)} total=${t.totalMs.toFixed(0)}\n\n`);
          }
        }
      } catch {
        // Never an error to the child: the pipeline already falls back; this is a last resort.
        send(chunk({ content: locale === "ar" ? "لنتحدث عن شيء آخر." : "Let's talk about something else. " }));
      }
      send(chunk({}, "stop"));
      send("data: [DONE]\n\n");
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
