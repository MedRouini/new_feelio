import "server-only";
import config from "@/content/safety/config.json";
import { configuredClassifier } from "./classify";
import { recordDecision } from "./events";
import { respond, type Generate, type Message, type TurnEvent } from "./pipeline";
import { chatStream } from "./providers/together";
import type { SafetyCtx } from "./types";

// One companion turn for voice or text, wired to the configured classifier and model (D-003, D-018).
// Routes call this; they never import a provider (CLAUDE.md rule 1).

/** How many earlier turns the model sees (short context: cheaper, faster, less to go wrong). */
const HISTORY_TURNS = 8;

const together =
  (kind: "voice" | "text"): Generate =>
  (messages, signal) =>
    chatStream({
      model: config.generation[kind].model,
      messages,
      maxTokens: config.generation[kind].maxTokens,
      temperature: config.generation[kind].temperature,
      timeoutMs: config.generation[kind].timeoutMs,
      signal,
    });

/** Keeps only the child's and Feelio's recent turns; any system text from a client is dropped. */
export function conversationOf(messages: { role: string; content: unknown }[]): Message[] {
  return messages
    .filter((m): m is { role: "user" | "assistant"; content: string } => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
}

export async function* companionTurn(
  ctx: SafetyCtx,
  messages: Message[],
  opts: { outputCheck?: "strict" | "gated"; /** Record statistics under another feature (adult tests: "test"). */ countAs?: SafetyCtx["feature"] } = {},
): AsyncGenerator<TurnEvent> {
  const classifier = await configuredClassifier();
  yield* respond(ctx, messages, {
    classifier,
    generate: together(ctx.feature === "voice" ? "voice" : "text"),
    outputCheck: opts.outputCheck,
    record: (c, decision, phase) => recordDecision(opts.countAs ? { ...c, feature: opts.countAs } : c, decision, phase),
  });
}
