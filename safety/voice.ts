import "server-only";
import config from "@/content/safety/config.json";
import { configuredClassifier } from "./classify";
import { recordDecision } from "./events";
import { respond, type Generate, type Message, type TurnEvent } from "./pipeline";
import type { CompanionContext } from "./prompts";
import { chatStream } from "./providers/together";
import type { SafetyCtx } from "./types";
import { MODEL_TOOLS, STORY_MODEL_TOOLS, modelTools, parseToolCall } from "./voice-agent/tools";

// One companion turn for voice or text, wired to the configured classifier and model (D-003, D-018).
// Routes call this; they never import a provider (CLAUDE.md rule 1).

/**
 * How much of the talk the model sees (D-077): a whole talk (at most a few minutes), so Feelio remembers
 * what the child said before, during and after a game. A character budget keeps each turn fast.
 */
const HISTORY_TURNS = 40;
const HISTORY_CHARS = 8000;

const together =
  (kind: "voice" | "text"): Generate =>
  (messages, signal, hooks) =>
    chatStream({
      model: config.generation[kind].model,
      messages,
      maxTokens: config.generation[kind].maxTokens,
      temperature: config.generation[kind].temperature,
      timeoutMs: config.generation[kind].timeoutMs,
      signal,
      tools: hooks?.tools,
      onToolCall: hooks?.onToolCall,
    });

/**
 * Keeps only the child's and Feelio's turns of this talk; any system text from a client is dropped.
 * `drop` takes out earlier child turns that weren't the child talking (silence, an echo of Feelio's
 * recorded lines, D-077); the last turn always stays, so the proxy can decide about it.
 */
export function conversationOf(messages: { role: string; content: unknown }[], drop: (text: string) => boolean = () => false): Message[] {
  const all = messages
    .filter((m): m is { role: "user" | "assistant"; content: string } => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const kept = all.filter((m, i) => i === all.length - 1 || m.role !== "user" || !drop(m.content)).slice(-HISTORY_TURNS);
  let chars = 0;
  let from = kept.length;
  while (from > 0 && chars + kept[from - 1].content.length <= HISTORY_CHARS) chars += kept[--from].content.length;
  return kept.slice(Math.min(from, kept.length - 1));
}

export async function* companionTurn(
  ctx: SafetyCtx,
  messages: Message[],
  opts: {
    outputCheck?: "strict" | "gated";
    /** Record statistics under another feature (adult tests: "test"). */
    countAs?: SafetyCtx["feature"];
    context?: CompanionContext;
    /** Offer tools to the model: the talk's screen tools (D-068) or the story workshop's (D-070). */
    tools?: "talk" | "story";
  } = {},
): AsyncGenerator<TurnEvent> {
  const classifier = await configuredClassifier();
  yield* respond(ctx, messages, {
    classifier,
    generate: together(ctx.feature === "voice" ? "voice" : "text"),
    outputCheck: opts.outputCheck,
    context: opts.context,
    mode: opts.tools === "story" ? "story" : "talk",
    tools: opts.tools
      ? {
          defs: modelTools(opts.tools === "story" ? STORY_MODEL_TOOLS : MODEL_TOOLS),
          accept: (name, args) => parseToolCall(name, args, opts.tools === "story" ? STORY_MODEL_TOOLS : MODEL_TOOLS),
        }
      : undefined,
    record: (c, decision, phase) => recordDecision(opts.countAs ? { ...c, feature: opts.countAs } : c, decision, phase),
  });
}
