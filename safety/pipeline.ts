import config from "@/content/safety/config.json";
import type { Classifier } from "./classify";
import { crisisScript, fallbackLine, redirectLine, resources } from "./content";
import { redact } from "./pii";
import { systemPrompt, type CompanionContext } from "./prompts";
import { route } from "./router";
import { t0Input, t0Output } from "./rules";
import type { Action, Decision, Finding, SafetyCtx } from "./types";
import type { ToolCall } from "./voice-agent/tools";

// The safety pipeline (SAFETY_POLICY §2.2, §3 design C "strict", D-018):
//   input → normalise → T0 rules ──crisis──▶ reviewed script (no model at all)
//                          └─▶ T1 classifier ∥ generation (tokens held until T1 answers)
//                                 └─▶ router ─▶ redirect / crisis / steer / allow
//   each sentence ─▶ T0 output rules ─▶ T1 output check (strict) ─▶ child, else a reviewed fallback.
// Feature code never calls a provider; it calls checkInput() or respond() (CLAUDE.md rule 1).

export type Message = { role: "system" | "user" | "assistant"; content: string };
/** Streams the model's words. With `hooks.tools`, tool calls the model makes go to `hooks.onToolCall` (unchecked). */
export type Generate = (
  messages: Message[],
  signal: AbortSignal,
  hooks?: { tools: unknown[]; onToolCall: (name: string, args: string) => void },
) => AsyncIterable<string>;

export type TurnEvent =
  | { type: "say"; text: string; source: "model" | "script" | "line" | "fallback" }
  | { type: "crisis"; script: string; resources: ReturnType<typeof resources>; mascot: "calm" | "empathy" }
  /** A screen-only client tool the model chose, validated against the allowlist; only after a fully released turn. */
  | { type: "tool"; call: ToolCall }
  | { type: "end"; reason: "done" | "crisis" | "redirected" | "output_blocked" | "degraded"; decision: Decision; timings: Timings };

export type Timings = { t0Ms: number; t1Ms: number | null; firstTokenMs: number | null; firstReleaseMs: number | null; totalMs: number; outputChecks: number };

export type RespondOptions = {
  classifier: Classifier | null;
  generate: Generate;
  /** "strict" (default, D-018): every sentence passes T1 before release. "gated": T0 only. */
  outputCheck?: "strict" | "gated";
  maxSentences?: number;
  /** Called once per turn with the final input decision (safety events). */
  record?: (ctx: SafetyCtx, decision: Decision, phase: "input" | "output") => Promise<void> | void;
  now?: () => number;
  pick?: () => number;
  /** What the companion may know about this child (server data only, never the client's word). */
  context?: CompanionContext;
  /** Client tools offered to the model (D-068), and the check each call must pass. */
  tools?: { defs: unknown[]; accept: (name: string, args: string) => ToolCall | null };
  /** "story": the story workshop's guide prompt (D-070). */
  mode?: "talk" | "story";
};

/** Steer notes that matter enough to restart generation when only T1 found them. */
const RESTART_NOTES = new Set(["gentle_check_in", "bullying_support", "real_friends", "keep_private", "no_secrets"]);

function decide(findings: Finding[], redacted: string): Decision {
  const r = route(findings);
  return { action: r.action, primary: r.primary, findings, event: r.event, redacted };
}

/** T0 only: synchronous and model-free. Used to short-circuit crises and by checkInput. */
export function checkInputT0(text: string): Decision {
  const red = redact(text);
  const findings = t0Input(text);
  if (red.found && !findings.some((f) => f.category === "pii")) findings.push({ category: "pii", severity: 1, source: "t0", rule: "pii.shape" });
  return decide(findings, red.text);
}

/** Full input check (T0 + T1) for non-streaming features (stories, text). Fails closed. */
export async function checkInput(ctx: SafetyCtx, text: string, classifier: Classifier | null): Promise<Decision & { degraded: boolean }> {
  const t0 = checkInputT0(text);
  if (t0.action.type === "crisis") return { ...t0, degraded: false };
  if (!classifier) return config.failClosed ? { ...t0, action: { type: "redirect", line: "check_in" }, degraded: true } : { ...t0, degraded: true };
  try {
    const t1 = await classifier.classify({ mode: "input", text: t0.redacted, ageBand: ctx.ageBand, locale: ctx.locale });
    return { ...decide([...t0.findings, ...t1], t0.redacted), degraded: false };
  } catch {
    return config.failClosed ? { ...t0, action: { type: "redirect", line: "check_in" }, degraded: true } : { ...t0, degraded: true };
  }
}

/** Checks one sentence the model wants to say. */
export async function checkOutput(ctx: SafetyCtx, sentence: string, opts: { classifier: Classifier | null; strict: boolean; context?: string }): Promise<{ ok: boolean; findings: Finding[] }> {
  const t0 = t0Output(sentence).filter((f) => f.severity >= 2);
  if (t0.length) return { ok: false, findings: t0 };
  if (!opts.strict) return { ok: true, findings: [] };
  if (!opts.classifier) return { ok: !config.failClosed, findings: [] };
  try {
    const t1 = await opts.classifier.classify({ mode: "output", text: sentence, ageBand: ctx.ageBand, locale: ctx.locale, context: opts.context });
    const bad = t1.filter((f) => f.severity >= 2);
    return { ok: bad.length === 0, findings: bad };
  } catch {
    return { ok: !config.failClosed, findings: [] };
  }
}

const SENTENCE_END = /([.!?؟…]+["')\]]*)(\s+|$)/u;

/** Splits off complete sentences from the front of the buffer. */
export function takeSentences(buf: string, final = false): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  let rest = buf;
  for (;;) {
    const m = SENTENCE_END.exec(rest);
    if (!m || (m.index + m[1].length === rest.length && !final && !m[2])) break;
    const end = m.index + m[1].length;
    const s = rest.slice(0, end).trim();
    rest = rest.slice(end).trimStart();
    if (s) sentences.push(s);
  }
  if (final && rest.trim()) {
    sentences.push(rest.trim());
    rest = "";
  }
  return { sentences, rest };
}

/**
 * One companion turn, end to end. Yields what may be said, in order, and always ends with an `end`
 * event. Never yields unchecked model text. `messages` is the conversation so far (no system
 * message), the last one being the child's.
 */
export async function* respond(ctx: SafetyCtx, messages: Message[], opts: RespondOptions): AsyncGenerator<TurnEvent> {
  const now = opts.now ?? (() => performance.now());
  const start = now();
  const strict = (opts.outputCheck ?? (config.voice.outputCheck as "strict" | "gated")) === "strict";
  const maxSentences = opts.maxSentences ?? (ctx.feature === "voice" ? 2 : 3);
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const timings: Timings = { t0Ms: 0, t1Ms: null, firstTokenMs: null, firstReleaseMs: null, totalMs: 0, outputChecks: 0 };
  const released = () => {
    timings.firstReleaseMs ??= now() - start;
  };
  const finish = (reason: Extract<TurnEvent, { type: "end" }>["reason"], decision: Decision): TurnEvent => {
    timings.totalMs = now() - start;
    return { type: "end", reason, decision, timings };
  };

  // 1. T0: deterministic, synchronous. A crisis never waits for a model.
  const t0 = checkInputT0(last);
  timings.t0Ms = now() - start;
  if (t0.action.type === "crisis") {
    await opts.record?.(ctx, t0, "input");
    yield* crisisEvents(ctx, t0.action);
    released();
    yield finish("crisis", t0);
    return;
  }
  if (t0.action.type === "redirect" || t0.action.type === "block") {
    await opts.record?.(ctx, t0, "input");
    yield { type: "say", text: lineFor(t0.action, ctx, opts.pick), source: "line" };
    released();
    yield finish("redirected", t0);
    return;
  }

  // 2. T1 on the input, in parallel with generation (design B/C). Tokens are held until it answers.
  const t1Start = now();
  const t1: Promise<Finding[] | "error"> = opts.classifier
    ? opts.classifier.classify({ mode: "input", text: t0.redacted, ageBand: ctx.ageBand, locale: ctx.locale }).catch(() => "error" as const)
    : Promise.resolve(config.failClosed ? ("error" as const) : []);
  let verdict: Decision | null = null;
  let verdictError = false;
  const settle = t1.then((r) => {
    timings.t1Ms = now() - t1Start;
    if (r === "error") verdictError = true;
    else verdict = decide([...t0.findings, ...r], t0.redacted);
  });

  const steer0 = t0.action.type === "steer" ? t0.action.notes : [];
  // The child's words go to the model redacted (no personal information).
  const history = messages.map((m, i) => (i === messages.length - 1 && m.role === "user" ? { ...m, content: t0.redacted } : m));
  const turn = { count: 0, blocked: null as Decision | null, broken: false };
  const calls: { name: string; args: string }[] = [];

  /** Checks one sentence; yields it or a fallback. Returns false when the turn must stop. */
  async function* release(sentence: string): AsyncGenerator<TurnEvent, boolean> {
    timings.outputChecks++;
    const out = await checkOutput(ctx, sentence, { classifier: opts.classifier, strict, context: t0.redacted });
    if (!out.ok) {
      turn.blocked = { ...decide(out.findings, ""), action: { type: "block", line: "fallback" } };
      await opts.record?.(ctx, turn.blocked, "output");
      yield { type: "say", text: fallbackLine(ctx.locale, opts.pick), source: "fallback" };
      released();
      return false;
    }
    yield { type: "say", text: sentence, source: "model" };
    released();
    turn.count++;
    return turn.count < maxSentences;
  }

  let notes = steer0;
  let toolsOff = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctl = new AbortController();
    const sys = systemPrompt({ ageBand: ctx.ageBand, locale: ctx.locale, feature: ctx.feature, steer: notes, place: ctx.placeId, context: opts.context, tools: Boolean(opts.tools), mode: opts.mode });
    if (!toolsOff) calls.length = 0;
    const hooks = opts.tools && !toolsOff ? { tools: opts.tools.defs, onToolCall: (name: string, args: string) => void calls.push({ name, args }) } : undefined;
    const stream = opts.generate([{ role: "system", content: sys }, ...history], ctl.signal, hooks);
    let buf = "";
    const held: string[] = [];
    let go = attempt > 0; // a restart already has the verdict
    let restart = false;
    let done = false;
    let broken = false;

    // What to do once the input verdict is known.
    const onVerdict = (): "go" | "restart" | "stop" => {
      if (verdictError || !verdict) return "stop";
      const a = verdict.action;
      if (a.type === "crisis" || a.type === "redirect" || a.type === "block") return "stop";
      if (attempt === 0 && a.type === "steer" && a.notes.some((n) => RESTART_NOTES.has(n) && !notes.includes(n))) return "restart";
      return "go";
    };

    try {
      for await (const delta of stream) {
        timings.firstTokenMs ??= now() - start;
        buf += delta;
        const split = takeSentences(buf);
        buf = split.rest;
        held.push(...split.sentences);
        if (!go && (verdict || verdictError)) {
          const v = onVerdict();
          if (v !== "go") {
            restart = v === "restart";
            done = true;
            break;
          }
          go = true;
        }
        while (go && held.length) {
          if (!(yield* release(held.shift()!))) {
            done = true;
            break;
          }
        }
        if (done) break;
      }
    } catch {
      // The model stream failed or timed out. Nothing unchecked was released; decide below, and
      // drop the unfinished fragment (a cut-off half sentence is never said).
      broken = true;
      turn.broken = true;
    }
    ctl.abort();

    if (!go && !done) {
      // The stream ended (or failed) before the classifier answered: wait for it now.
      await settle;
      const v = onVerdict();
      if (v === "restart") restart = true;
      else if (v === "go") go = true;
    }
    if (restart) {
      notes = verdict!.action.type === "steer" ? verdict!.action.notes : notes;
      continue;
    }
    if (go && !broken && !turn.blocked && turn.count < maxSentences) {
      held.push(...takeSentences(buf, true).sentences);
      // The model only used tools and said nothing: ask once more for words, with tools off. The calls
      // it made are kept, and still run only if the words are released.
      if (!held.length && turn.count === 0 && calls.length && !toolsOff) {
        toolsOff = true;
        continue;
      }
      while (held.length && (yield* release(held.shift()!)));
    }
    break;
  }

  await settle;
  const decision = verdict ?? t0;
  await opts.record?.(ctx, decision, "input");
  if (turn.blocked) {
    yield finish("output_blocked", decision);
    return;
  }
  if (decision.action.type === "crisis") {
    yield* crisisEvents(ctx, decision.action);
    released();
    yield finish("crisis", decision);
    return;
  }
  if (decision.action.type === "redirect" || decision.action.type === "block") {
    yield { type: "say", text: lineFor(decision.action, ctx, opts.pick), source: "line" };
    released();
    yield finish("redirected", decision);
    return;
  }
  if (verdictError || turn.count === 0) {
    // The classifier failed (fail closed) or nothing safe came out: a reviewed line instead. Without
    // a verdict we can't rule out a crisis, so it is the gentle check-in, not a change of subject.
    const line = verdictError ? redirectLine("check_in", ctx.locale, opts.pick) : fallbackLine(ctx.locale, opts.pick);
    yield { type: "say", text: line, source: "fallback" };
    released();
    yield finish("degraded", decision);
    return;
  }
  // Tools only after a turn whose every sentence was released, so a blocked or cut turn never acts.
  if (!turn.broken && opts.tools) {
    const seen = new Set<string>();
    for (const c of calls) {
      const call = opts.tools.accept(c.name, c.args);
      if (call && !seen.has(call.name)) {
        seen.add(call.name);
        yield { type: "tool", call };
      }
    }
  }
  yield finish("done", decision);
}

function lineFor(action: Action, ctx: SafetyCtx, pick?: () => number): string {
  if (action.type === "redirect" || action.type === "block") return action.line === "fallback" ? fallbackLine(ctx.locale, pick) : redirectLine(action.line, ctx.locale, pick);
  return fallbackLine(ctx.locale, pick);
}

function* crisisEvents(ctx: SafetyCtx, action: Extract<Action, { type: "crisis" }>): Generator<TurnEvent> {
  const text = crisisScript(action.script, ctx.locale, ctx.ageBand);
  yield { type: "crisis", script: action.script, resources: resources(action.resources, ctx.market, ctx.locale), mascot: action.mascot };
  yield { type: "say", text, source: "script" };
}
