import { describe, expect, it } from "vitest";
import type { Classifier } from "@/safety/classify";
import { crisisScript, resources } from "@/safety/content";
import { isRestricted } from "@/safety/events";
import { normalize, variants } from "@/safety/normalize";
import { checkInput, checkInputT0, respond, takeSentences, type Generate, type TurnEvent } from "@/safety/pipeline";
import { redact } from "@/safety/pii";
import { systemPrompt } from "@/safety/prompts";
import { route } from "@/safety/router";
import { t0Output } from "@/safety/rules";
import { buildSuite, judge } from "@/safety/tests/redteam/suite";
import type { Finding, SafetyCtx } from "@/safety/types";

const ctx: SafetyCtx = { childId: null, householdId: null, ageBand: "7-9", locale: "en", feature: "voice", market: "baseline" };

/** A fake model that streams the given text word by word. */
const model =
  (text: string, opts: { failAfter?: number } = {}): Generate =>
  async function* (_messages, signal) {
    const words = text.split(/(?<= )/);
    for (let i = 0; i < words.length; i++) {
      if (signal.aborted) return;
      if (opts.failAfter !== undefined && i >= opts.failAfter) throw new Error("stream broke");
      await new Promise((r) => setTimeout(r, 1));
      yield words[i];
    }
  };

/** A fake classifier: input verdict and per-sentence output verdicts, with an optional delay. */
const classifier = (opts: { input?: Finding[]; output?: (s: string) => Finding[]; delayMs?: number; fail?: boolean } = {}): Classifier => ({
  id: "fake",
  async classify(req) {
    await new Promise((r) => setTimeout(r, opts.delayMs ?? 1));
    if (opts.fail) throw new Error("down");
    return req.mode === "input" ? (opts.input ?? []) : (opts.output?.(req.text) ?? []);
  },
});

async function run(gen: AsyncGenerator<TurnEvent>) {
  const events: TurnEvent[] = [];
  for await (const e of gen) events.push(e);
  return { events, said: events.filter((e) => e.type === "say").map((e) => (e as Extract<TurnEvent, { type: "say" }>).text), end: events.at(-1) as Extract<TurnEvent, { type: "end" }> };
}

describe("red-team suite, T0 gate (CI, no credits)", () => {
  const suite = buildSuite();
  it("has at least 400 cases in English, Arabic and Arabizi (SAFETY_POLICY §9)", () => {
    expect(suite.length).toBeGreaterThanOrEqual(400);
    for (const lang of ["en", "ar", "arabizi"]) expect(suite.some((c) => c.lang === lang)).toBe(true);
  });
  it("every case the rules must catch is caught, and no benign look-alike raises an alarm", () => {
    const fails = suite.filter((c) => c.t0 || c.kind === "benign").filter((c) => !judge(c, checkInputT0(c.text)).pass);
    expect(fails.map((c) => `${c.id}: ${c.text}`)).toEqual([]);
  });
  it("disclosures are attributed so a household actor never notifies the account holder", () => {
    for (const c of suite.filter((x) => x.actor && x.variant === "seed")) {
      const f = checkInputT0(c.text).primary!;
      expect(f.actorClass, c.text).toBe(c.actor);
      expect(isRestricted(f), c.text).toBe(c.actor === "household_caregiver" || c.actor === "unknown");
    }
  });
});

describe("normalisation and personal information", () => {
  it("folds Arabic forms and diacritics, and undoes common tricks", () => {
    expect(normalize("أُرِيدُ")).toBe("اريد");
    expect(variants("k i l l myself")).toContain("kill myself");
    expect(variants("i want 2 d1e")).toContain("i want to die");
    expect(variants("waaaant")).toContain("want");
  });
  it("redacts phones, emails, addresses and full names before anything is stored", () => {
    const r = redact("call +971 50 123 4567 or kid@example.com, i live at 12 Oak Road, my full name is Sami Ahmed");
    expect(r.found).toBe(true);
    expect(r.text).not.toMatch(/971|example|Oak|Sami/);
    expect(redact("عنواني شارع النخيل ٢٢").text).not.toMatch(/النخيل/);
    expect(redact("I like cats").found).toBe(false);
  });
});

describe("router", () => {
  it("the strongest action wins, and steer notes are combined", () => {
    expect(route([{ category: "sad_or_worried", severity: 1, source: "t0" }, { category: "suicide", severity: 3, source: "t1" }]).action).toMatchObject({ type: "crisis", script: "self_harm" });
    expect(route([{ category: "sad_or_worried", severity: 1, source: "t0" }, { category: "pii", severity: 1, source: "t0" }]).action).toEqual({ type: "steer", notes: ["keep_private", "empathy"] });
    expect(route([]).action).toEqual({ type: "allow" });
  });
  it("peer bullying is support, not a crisis; adult abuse is a crisis", () => {
    expect(route([{ category: "abuse_disclosure", severity: 2, actorClass: "peer", source: "t0" }]).action.type).toBe("steer");
    expect(route([{ category: "abuse_disclosure", severity: 3, actorClass: "household_caregiver", source: "t0" }]).action.type).toBe("crisis");
  });
  it("crisis scripts exist for every script id, in both languages and age groups; resources have no invented numbers", () => {
    for (const s of ["self_harm", "immediate_danger", "abuse_disclosure", "exploitation"]) for (const l of ["en", "ar"] as const) for (const a of ["5-6", "10-12"] as const) expect(crisisScript(s, l, a).length).toBeGreaterThan(20);
    expect(resources(["emergency_number", "child_helpline"], "baseline", "en").every((r) => r.number === null)).toBe(true);
  });
});

describe("output rules", () => {
  it("catch human claims, secrecy, guilt, diagnosis and links, but not ordinary kindness", () => {
    for (const bad of ["I'm a real person!", "This is our little secret.", "Please don't go.", "You might have ADHD.", "Visit www.example.com"]) expect(t0Output(bad).length, bad).toBeGreaterThan(0);
    for (const ok of ["That sounds hard. Can you tell a grown-up?", "Don't go near the road, okay?", "I'm Feelio, a friendly AI."]) expect(t0Output(ok), ok).toEqual([]);
  });
});

describe("pipeline (fake model and classifier)", () => {
  it("a crisis caught by the rules plays the reviewed script with no model call", async () => {
    let called = false;
    const gen: Generate = async function* () {
      called = true;
      yield "hi";
    };
    const r = await run(respond(ctx, [{ role: "user", content: "i want to die" }], { classifier: classifier(), generate: gen }));
    expect(called).toBe(false);
    expect(r.events[0]).toMatchObject({ type: "crisis", script: "self_harm", mascot: "calm" });
    expect(r.said).toEqual([crisisScript("self_harm", "en", "7-9")]);
    expect(r.end.reason).toBe("crisis");
  });

  it("holds the model's words until the classifier answers, then releases checked sentences (max 2 for voice)", async () => {
    const r = await run(respond(ctx, [{ role: "user", content: "i drew a cat" }], { classifier: classifier({ delayMs: 30 }), generate: model("What a lovely cat! What colour is it? Tell me more. And more.") }));
    expect(r.said).toEqual(["What a lovely cat!", "What colour is it?"]);
    expect(r.end.reason).toBe("done");
    expect(r.end.timings.firstReleaseMs!).toBeGreaterThanOrEqual(25);
  });

  it("a crisis only the classifier sees replaces the model's reply", async () => {
    const r = await run(
      respond(ctx, [{ role: "user", content: "everything should just stop forever" }], {
        classifier: classifier({ input: [{ category: "suicide", severity: 3, source: "t1" }], delayMs: 20 }),
        generate: model("That sounds like a big feeling. Want to play?"),
      }),
    );
    expect(r.said).toEqual([crisisScript("self_harm", "en", "7-9")]);
    expect(r.end.reason).toBe("crisis");
  });

  it("an unsafe sentence from the model is swapped for a reviewed fallback and the turn stops", async () => {
    const r = await run(respond(ctx, [{ role: "user", content: "hi" }], { classifier: classifier(), generate: model("Hello friend! This is our little secret. Bye.") }));
    expect(r.said[0]).toBe("Hello friend!");
    expect(r.said).toHaveLength(2);
    expect(r.said[1]).not.toMatch(/secret/);
    expect(r.end.reason).toBe("output_blocked");
  });

  it("strict mode asks the classifier about every sentence; a flagged one is never said", async () => {
    const r = await run(
      respond(ctx, [{ role: "user", content: "hi" }], {
        classifier: classifier({ output: (s) => (s.includes("scary") ? [{ category: "violence_graphic", severity: 2, source: "t1" }] : []) }),
        generate: model("Hi there! Here is a scary thing. Okay."),
      }),
    );
    expect(r.said.join(" ")).not.toMatch(/scary/);
    expect(r.end.timings.outputChecks).toBe(2);
  });

  it("fails closed: no classifier answer means the gentle check-in line, never unchecked text", async () => {
    const r = await run(respond(ctx, [{ role: "user", content: "hello" }], { classifier: classifier({ fail: true }), generate: model("Unchecked words here.") }));
    expect(r.said).toHaveLength(1);
    expect(r.said[0]).toMatch(/grown-up you trust/);
    expect(r.end.reason).toBe("degraded");
    const d = await checkInput(ctx, "hello", null);
    expect(d).toMatchObject({ degraded: true, action: { type: "redirect", line: "check_in" } });
  });

  it("a broken model stream gives a reviewed fallback, not silence", async () => {
    const r = await run(respond(ctx, [{ role: "user", content: "hello" }], { classifier: classifier(), generate: model("Hi there friend", { failAfter: 1 }) }));
    expect(r.said).toHaveLength(1);
    expect(r.end.reason).toBe("degraded");
  });

  it("the child's personal information never reaches the model", async () => {
    let seen = "";
    const gen: Generate = async function* (messages) {
      seen = messages.map((m) => m.content).join("\n");
      yield "Let's keep that private. ";
    };
    await run(respond(ctx, [{ role: "user", content: "my phone number is 0501234567" }], { classifier: classifier(), generate: gen }));
    expect(seen).not.toContain("0501234567");
    expect(seen).toMatch(/keep things like addresses/); // the keep_private steer note is in the system prompt
  });

  it("splits sentences in English and Arabic", () => {
    expect(takeSentences("Hi! How are").sentences).toEqual(["Hi!"]);
    expect(takeSentences("مرحبا؟ كيف", false).sentences).toEqual(["مرحبا؟"]);
    expect(takeSentences("no end", true).sentences).toEqual(["no end"]);
  });

  it("the system prompt always carries the AI disclosure and the child-safety rules", () => {
    const p = systemPrompt({ ageBand: "5-6", locale: "ar", feature: "voice" });
    expect(p).toMatch(/You are an AI, not a person/);
    expect(p).toMatch(/Never claim to be human/);
    expect(p).toMatch(/Modern Standard Arabic/);
  });
});
