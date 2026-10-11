// Compares candidate generation models for Feelio's companion (D-062): time to first token, total time
// and the reply itself, with the real child-safety system prompt. Synthetic child turns only; a few
// cents of Together credits.   npx tsx --conditions=react-server scripts/model-probe.ts [model ...]
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}

const DEFAULT_MODELS = [
  "Qwen/Qwen3.5-9B",
  "Qwen/Qwen3.8-Flash",
  "google/gemma-4-31B-it",
  "meta-models/Muse-Glimmer-30B",
  "deepseek-ai/DeepSeek-V4-Flash-0731",
  "Qwen/Qwen3-Next-80B-A3B-Instruct",
];

const PROMPTS: { locale: "en" | "ar"; text: string }[] = [
  { locale: "en", text: "my friend didn't want to play with me today" },
  { locale: "ar", text: "صديقي ما لعب معي اليوم وانا زعلان" },
  { locale: "ar", text: "هل انت انسان؟" },
];

async function main() {
  const models = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_MODELS;
  const { chatStream } = await import("../safety/providers/together");
  const { systemPrompt } = await import("../safety/prompts");
  for (const model of models) {
    console.log(`\n=== ${model}`);
    for (const p of PROMPTS) {
      const sys = systemPrompt({ ageBand: "7-9", locale: p.locale, feature: "voice", steer: p.text.includes("زعلان") || p.text.includes("didn't") ? ["empathy"] : ["honest_ai"] });
      const t0 = performance.now();
      let first: number | null = null;
      let out = "";
      try {
        for await (const d of chatStream({ model, messages: [{ role: "system", content: sys }, { role: "user", content: p.text }], maxTokens: 90, temperature: 0.6, timeoutMs: 12000 })) {
          first ??= performance.now() - t0;
          out += d;
        }
        console.log(`  first=${first?.toFixed(0).padStart(5)}ms total=${(performance.now() - t0).toFixed(0).padStart(5)}ms  ${out.replace(/\s+/g, " ").trim()}`);
      } catch (e) {
        console.log(`  ERROR ${e instanceof Error ? e.message : e}`);
      }
    }
  }
}

main();
