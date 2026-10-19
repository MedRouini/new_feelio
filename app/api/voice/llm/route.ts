import { timingSafeEqual } from "node:crypto";
import { type NextRequest } from "next/server";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { recordedLines } from "@/child/gameMemory";
import { proxyTurn } from "@/child/voice";
import { env } from "@/platform/env";
import { setDraftChoice, setDraftListChoice } from "@/child/stories";
import { namedChoices, type Slot } from "@/safety/stories/choices";
import { mapIdea } from "@/safety/stories/ideas";
import { companionTurn, conversationOf } from "@/safety/voice";
import { notTalk, staysQuiet } from "@/safety/voice-agent/heard";
import { afterActivity, allowedForChild, stillAsking, type ToolCall } from "@/safety/voice-agent/tools";
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
/** Feelio's recorded game lines: heard back through the microphone, they are an echo, not the child (D-077). */
const RECORDED = recordedLines();

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

  let body: { messages?: { role: string; content: unknown }[]; tools?: { function?: { name?: string } }[]; elevenlabs_extra_body?: { feelio_session?: unknown; feelio_after?: unknown } };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  // One conversation (D-077): the whole talk, without silences and echoes the agent heard earlier.
  const messages = conversationOf(body.messages ?? [], (text) => notTalk(text, RECORDED));
  const offered = new Set((body.tools ?? []).map((t) => t.function?.name).filter(Boolean));

  const extra = body.elevenlabs_extra_body?.feelio_session;
  const sessionId = typeof extra === "string" ? extra : null;
  // The calm activity the child just finished (D-076): an id from a closed list, never words.
  const after = afterActivity(body.elevenlabs_extra_body?.feelio_after);
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
      // During a game (D-077), only the child talking gets an answer: silence, small sounds like a breath
      // or "hmm", and Feelio's own recorded lines coming back through the microphone get none, so Feelio
      // never talks over the game. An echo never gets an answer at all. Anything the safety rules notice
      // always goes through the full pipeline.
      const game = turn.ok ? turn.context.game?.now : null;
      const playing = game?.status === "running" || game?.status === "paused";
      if (staysQuiet(messages[messages.length - 1].content, { playing, lines: RECORDED })) return finish();

      const ctx: SafetyCtx = turn.ok
        ? turn.ctx
        : { childId: null, householdId: null, ageBand: "7-9", locale, feature: "voice", market: e.DEFAULT_MARKET };
      try {
        const events = companionTurn(ctx, messages, turn.ok
          ? {
              // D-068: the faster output check only for the owner's adult tests; strict (D-018) for children.
              outputCheck: turn.session.adultTest ? "gated" : "strict",
              countAs: turn.session.adultTest ? "test" : undefined,
              context: { ...turn.context, after },
              tools: turn.session.purpose === "story" ? "story" : "talk",
            }
          : { countAs: "test" });
        const tools: ToolCall[] = [];
        let said = "";
        const serverCalls: Extract<ToolCall, { name: "set_story_choice" | "story_idea" }>[] = [];
        for await (const ev of events) {
          if (ev.type === "say") {
            said += ev.text + " ";
            send(chunk({ content: ev.text + " " }));
          }
          // Crisis: the router (never the model) shows who can help, and calms the mascot.
          if (ev.type === "crisis") {
            tools.push({ name: "show_safety_resources", args: { kinds: ev.resources.map((r) => r.kind) } });
            tools.push({ name: "set_mascot_state", args: { mood: ev.mascot === "empathy" ? "empathy" : "calm" } });
          }
          // Only what this child can open (the server's data): a place they reached, a story when story making is open.
          if (ev.type === "tool" && (ev.call.name === "set_story_choice" || ev.call.name === "story_idea")) serverCalls.push(ev.call);
          else if (ev.type === "tool" && (!turn.ok || allowedForChild(ev.call, { placesOpen: turn.context.placesOpen ?? [], storiesOpen: turn.context.storiesOpen ?? false, playing }))) tools.push(ev.call);
          if (ev.type === "end") {
            const t = ev.timings;
            send(`: feelio ${ev.reason} t0=${t.t0Ms.toFixed(0)} t1=${t.t1Ms?.toFixed(0)} first_token=${t.firstTokenMs?.toFixed(0)} first_release=${t.firstReleaseMs?.toFixed(0)} total=${t.totalMs.toFixed(0)}\n\n`);
          }
        }
        // Story workshop (D-070): the server fills the slot (a free idea is checked first), then tells the
        // screen. A declined idea gets a fixed, kind line: the child picks from the pictures instead.
        if (turn.ok && turn.session.purpose === "story") {
          // Safety net: a list choice the child clearly named, for a slot the model didn't fill this turn
          // (ids from our lists only). Ideas (free words) always go through story_idea and its checks.
          const named = namedChoices(messages[messages.length - 1].content);
          const called = new Set(serverCalls.map((c) => c.args.slot));
          for (const [slot, id] of Object.entries(named) as [Slot, string][]) {
            if (!called.has(slot)) serverCalls.push({ name: "set_story_choice", args: { slot, id } });
          }
          for (const c of serverCalls) {
            if (c.name === "set_story_choice") {
              const draft = await setDraftListChoice(turn.session.childId, c.args.slot, c.args.id);
              const ch = draft?.[c.args.slot];
              if (ch) tools.push({ name: "show_story_choice", args: { slot: c.args.slot, id: ch.id, en: ch.en, ar: ch.ar } });
            } else if (c.name === "story_idea") {
              const r = await mapIdea(ctx, c.args.slot, c.args.idea);
              if (r.ok) {
                await setDraftChoice(turn.session.childId, c.args.slot, r.choice);
                tools.push({ name: "show_story_choice", args: { slot: c.args.slot, id: r.choice.id, en: r.choice.en, ar: r.choice.ar } });
              } else {
                send(chunk({ content: LINES[locale].ideaDeclined + " " }));
              }
            }
          }
        }
        // Feelio still asking ("would you like…?"): the activity waits for the child's yes.
        for (const c of tools) if (!(c.name === "offer_activity" && stillAsking(said))) send(toolChunk(c.name, c.args));
      } catch {
        // Never an error to the child: the pipeline already falls back; this is a last resort.
        send(chunk({ content: LINES[locale].trouble + " " }));
      }
      finish();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
