import "server-only";
import { env } from "@/platform/env";

// The only code in the app that talks to Together AI (CLAUDE.md rule 1, SR-11; the lint rule allows
// provider hosts only under safety/). Plain fetch, no SDK. The API key never appears in errors or logs.
// API shape checked 2026-10-11: OpenAI-compatible /v1/chat/completions; `reasoning: {enabled: false}`
// turns thinking off for Qwen3.5; `response_format: json_schema` gives structured output.

const BASE = "https://api.together.xyz/v1";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function key(): string {
  const k = env().TOGETHER_API_KEY;
  if (!k) throw new ProviderError("TOGETHER_API_KEY is not set (see .env.example)");
  return k;
}

function withTimeout(ms: number, outer?: AbortSignal) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(new ProviderError(`timed out after ${ms} ms`)), ms);
  outer?.addEventListener("abort", () => ctl.abort(outer.reason), { once: true });
  return { signal: ctl.signal, done: () => clearTimeout(t) };
}

async function post(body: unknown, signal: AbortSignal) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key()}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new ProviderError(`Together returned ${res.status}`, res.status);
  return res;
}

export type Usage = { prompt_tokens: number; completion_tokens: number };

/** One structured (JSON schema) completion. */
export async function chatJson<T>(opts: {
  model: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  maxTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
}): Promise<{ value: T; usage: Usage | null }> {
  const { signal, done } = withTimeout(opts.timeoutMs, opts.signal);
  try {
    const res = await post(
      {
        model: opts.model,
        messages: opts.messages,
        max_tokens: opts.maxTokens,
        temperature: 0,
        reasoning: { enabled: false },
        response_format: { type: "json_schema", json_schema: { name: "verdict", strict: true, schema: opts.schema } },
      },
      signal,
    );
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) throw new ProviderError("empty response");
    return { value: JSON.parse(text) as T, usage: data.usage ?? null };
  } finally {
    done();
  }
}

/** A streamed completion: yields text deltas as they arrive. */
export async function* chatStream(opts: {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  signal?: AbortSignal;
  /** OpenAI-style function tools the model may call (voice client tools, D-068). */
  tools?: unknown[];
  /** Receives each complete tool call once the stream ends (arguments as the model wrote them, unchecked). */
  onToolCall?: (name: string, args: string) => void;
}): AsyncGenerator<string> {
  const { signal, done } = withTimeout(opts.timeoutMs, opts.signal);
  try {
    const res = await post(
      {
        model: opts.model,
        messages: opts.messages,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        reasoning: { enabled: false },
        stream: true,
        ...(opts.tools?.length ? { tools: opts.tools, tool_choice: "auto" } : {}),
      },
      signal,
    );
    if (!res.body) throw new ProviderError("no stream body");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    // Tool calls arrive in pieces, keyed by index: the name first, then the arguments in fragments.
    const calls: { name: string; args: string }[] = [];
    const flushCalls = () => {
      for (const c of calls) if (c?.name) opts.onToolCall?.(c.name, c.args);
      calls.length = 0;
    };
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          flushCalls();
          return;
        }
        try {
          const d = JSON.parse(payload)?.choices?.[0]?.delta;
          for (const tc of (d?.tool_calls ?? []) as { index?: number; function?: { name?: string; arguments?: string } }[]) {
            const i = tc.index ?? 0;
            calls[i] ??= { name: "", args: "" };
            if (tc.function?.name) calls[i].name += tc.function.name;
            if (tc.function?.arguments) calls[i].args += tc.function.arguments;
          }
          if (d?.content) yield d.content as string;
        } catch {
          // a keep-alive or partial line: ignore
        }
      }
    }
    flushCalls();
  } finally {
    done();
  }
}
