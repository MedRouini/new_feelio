// Voice-turn latency of the safety pipeline (D-018): time from the child's words reaching our proxy
// to the first checked words released, in strict mode (every sentence reviewed by the classifier) and
// gated mode (deterministic output rules only). Synthetic child turns, adult-only spike; uses a few
// cents of Together credits. ElevenLabs' own speech-to-text and text-to-speech time comes on top.
//   npx tsx --conditions=react-server scripts/voice-latency.ts [rounds]
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
}

const TURNS: { locale: "en" | "ar"; text: string }[] = [
  { locale: "en", text: "I drew a picture of my cat today" },
  { locale: "en", text: "I'm a bit nervous about my test tomorrow" },
  { locale: "en", text: "what's your favourite animal" },
  { locale: "en", text: "my friend didn't want to play with me" },
  { locale: "en", text: "we went to the park and I went on the swings" },
  { locale: "en", text: "I'm angry because my brother broke my lego" },
  { locale: "en", text: "can you tell me a joke" },
  { locale: "en", text: "are you a real person" },
  { locale: "ar", text: "رسمت صورة قطتي اليوم" },
  { locale: "ar", text: "انا خايف من الامتحان بكره" },
  { locale: "ar", text: "صديقي ما لعب معي اليوم" },
  { locale: "ar", text: "هل انت انسان" },
];

async function main() {
  const rounds = Number(process.argv[2] ?? 1);
  const { respond } = await import("../safety/pipeline");
  const { configuredClassifier } = await import("../safety/classify");
  const { chatStream } = await import("../safety/providers/together");
  const config = (await import("../content/safety/config.json")).default;
  const classifier = await configuredClassifier();
  const generate = (messages: { role: "system" | "user" | "assistant"; content: string }[], signal: AbortSignal) =>
    chatStream({ model: config.generation.voice.model, messages, maxTokens: config.generation.voice.maxTokens, temperature: config.generation.voice.temperature, timeoutMs: config.generation.voice.timeoutMs, signal });

  const results: Record<string, { first: number[]; total: number[]; t1: number[]; token: number[]; reasons: string[] }> = {};
  for (const mode of ["strict", "gated"] as const) results[mode] = { first: [], total: [], t1: [], token: [], reasons: [] };
  // Modes alternate turn by turn, so a slow minute at the provider affects both equally.
  for (let r = 0; r < rounds; r++) {
    for (const turn of TURNS) {
      for (const mode of ["strict", "gated"] as const) {
        const ctx = { childId: null, householdId: null, ageBand: "7-9" as const, locale: turn.locale, feature: "voice" as const, market: "baseline" };
        const said: string[] = [];
        for await (const ev of respond(ctx, [{ role: "user", content: turn.text }], { classifier, generate, outputCheck: mode })) {
          if (ev.type === "say") said.push(ev.text);
          if (ev.type === "end") {
            const t = ev.timings;
            results[mode].first.push(t.firstReleaseMs ?? NaN);
            results[mode].total.push(t.totalMs);
            if (t.t1Ms !== null) results[mode].t1.push(t.t1Ms);
            if (t.firstTokenMs !== null) results[mode].token.push(t.firstTokenMs);
            results[mode].reasons.push(ev.reason);
            if (r === 0) console.log(`${mode.padEnd(6)} ${ev.reason.padEnd(14)} first=${t.firstReleaseMs?.toFixed(0).padStart(5)}ms  ${JSON.stringify(turn.text).padEnd(48)} → ${said.join(" ")}`);
          }
        }
      }
    }
  }
  const pct = (xs: number[], p: number) => {
    const s = [...xs].filter((x) => !Number.isNaN(x)).sort((a, b) => a - b);
    return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]) : null;
  };
  const summary = Object.fromEntries(
    Object.entries(results).map(([mode, r]) => [
      mode,
      {
        turns: r.first.length,
        firstWordsMs: { p50: pct(r.first, 50), p95: pct(r.first, 95) },
        classifierInputMs: { p50: pct(r.t1, 50), p95: pct(r.t1, 95) },
        modelFirstTokenMs: { p50: pct(r.token, 50), p95: pct(r.token, 95) },
        totalMs: { p50: pct(r.total, 50), p95: pct(r.total, 95) },
        reasons: r.reasons.reduce<Record<string, number>>((a, x) => ({ ...a, [x]: (a[x] ?? 0) + 1 }), {}),
      },
    ]),
  );
  console.log(JSON.stringify({ date: new Date().toISOString(), classifier: classifier?.id, model: config.generation.voice.model, from: "developer machine (not Vercel)", summary }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
