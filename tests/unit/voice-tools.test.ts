import { describe, expect, it } from "vitest";
import type { Classifier } from "@/safety/classify";
import { respond, type Generate, type TurnEvent } from "@/safety/pipeline";
import { systemPrompt } from "@/safety/prompts";
import { MODEL_TOOLS, modelTools, parseToolCall } from "@/safety/voice-agent/tools";
import type { SafetyCtx } from "@/safety/types";

// Voice client tools (D-068): closed lists, validated twice, only after a fully released turn, and the
// crisis tool is never offered to the model.

const ctx: SafetyCtx = { childId: null, householdId: null, ageBand: "7-9", locale: "en", feature: "voice", market: "baseline" };
const ok: Classifier = { id: "fake", classify: async () => [] };
const tools = { defs: modelTools(), accept: (n: string, a: string) => parseToolCall(n, a) };

/** A fake model that says `text`, then reports tool calls the way the provider does (at stream end). */
const model =
  (text: string, calls: [string, string][]): Generate =>
  async function* (_m, _signal, hooks) {
    for (const w of text.split(/(?<= )/)) {
      await new Promise((r) => setTimeout(r, 1));
      yield w;
    }
    for (const [n, a] of calls) hooks?.onToolCall(n, a);
  };

async function run(gen: AsyncGenerator<TurnEvent>) {
  const events: TurnEvent[] = [];
  for await (const e of gen) events.push(e);
  return events;
}

describe("voice client tools", () => {
  it("accepts only allowlisted names with valid closed-list arguments", () => {
    expect(parseToolCall("set_mascot_state", '{"mood":"happy"}')).toEqual({ name: "set_mascot_state", args: { mood: "happy" } });
    expect(parseToolCall("set_mascot_state", '{"mood":"furious"}')).toBeNull();
    expect(parseToolCall("start_breathing", '{"rounds":9}')).toBeNull();
    expect(parseToolCall("suggest_place", '{"place":"casino"}')).toBeNull();
    expect(parseToolCall("show_feeling_card", '{"feeling":"sad","extra":"x"}')).toBeNull();
    expect(parseToolCall("open_url", '{"url":"https://example.test"}')).toBeNull();
    expect(parseToolCall("set_mascot_state", "{not json")).toBeNull();
  });

  it("never offers the crisis tool to the model; it's for the router only", () => {
    expect(MODEL_TOOLS).not.toContain("show_safety_resources");
    expect(modelTools().map((t) => t.function.name)).not.toContain("show_safety_resources");
    expect(parseToolCall("show_safety_resources", '{"kinds":["trusted_adult"]}')).toBeNull();
    expect(parseToolCall("show_safety_resources", '{"kinds":["trusted_adult"]}', ["show_safety_resources"])).not.toBeNull();
  });

  it("emits a valid tool after the released words, and drops invalid or repeated ones", async () => {
    const events = await run(
      respond(ctx, [{ role: "user", content: "I feel a bit sad" }], {
        classifier: ok,
        outputCheck: "gated",
        generate: model("I'm here with you. ", [
          ["show_feeling_card", '{"feeling":"sad"}'],
          ["show_feeling_card", '{"feeling":"happy"}'],
          ["show_safety_resources", '{"kinds":["crisis_line"]}'],
          ["delete_everything", "{}"],
        ]),
        tools,
      }),
    );
    const kinds = events.map((e) => e.type);
    expect(kinds.indexOf("say")).toBeLessThan(kinds.indexOf("tool"));
    expect(events.filter((e) => e.type === "tool")).toEqual([{ type: "tool", call: { name: "show_feeling_card", args: { feeling: "sad" } } }]);
  });

  it("a turn whose words were blocked never runs a tool", async () => {
    const strictBlock: Classifier = { id: "fake", classify: async (r) => (r.mode === "output" ? [{ category: "violence", severity: 3, source: "t1" } as never] : []) };
    const events = await run(
      respond(ctx, [{ role: "user", content: "tell me something" }], {
        classifier: strictBlock,
        outputCheck: "strict",
        generate: model("Here is a thing. ", [["set_mascot_state", '{"mood":"excited"}']]),
        tools,
      }),
    );
    expect(events.some((e) => e.type === "tool")).toBe(false);
  });

  it("the system prompt carries the child's context but never free text", () => {
    const p = systemPrompt({ ageBand: "7-9", locale: "en", feature: "voice", context: { name: "Star", interests: ["space"], placesOpen: ["home"], levelsDone: 2, secondsLeft: 30 }, tools: true });
    expect(p).toMatch(/called Star/);
    expect(p).toMatch(/likes: space/);
    expect(p).toMatch(/warm goodbye/);
    expect(p).toMatch(/set_mascot_state/);
  });
});

describe("tool-only answers", () => {
  it("asks once more for words (tools off) and keeps the tool the model chose", async () => {
    let calls = 0;
    const gen: Generate = async function* (_m, _s, hooks) {
      calls++;
      if (hooks) {
        hooks.onToolCall("show_feeling_card", '{"feeling":"sad"}');
        return;
      }
      yield "That sounds hard. ";
    };
    const events = await run(respond(ctx, [{ role: "user", content: "I feel sad" }], { classifier: ok, outputCheck: "gated", generate: gen, tools }));
    expect(calls).toBe(2);
    expect(events.filter((e) => e.type === "say").map((e) => (e as { text: string }).text)).toEqual(["That sounds hard."]);
    expect(events.some((e) => e.type === "tool")).toBe(true);
    expect((events.at(-1) as { reason: string }).reason).toBe("done");
  });
});
