// Story engine probe (D-070): writes a few stories and maps a few free ideas through the real safety
// layer, and prints them with timings. Synthetic only (no child). A few cents of Together credits.
//   npx tsx --conditions=react-server scripts/story-probe.ts [stories] [ideas]
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
}

async function main() {
  const [nStories = "3", nIdeas = "1"] = process.argv.slice(2);
  const { writeStory } = await import("../safety/stories/write");
  const { mapIdea } = await import("../safety/stories/ideas");
  const { choice } = await import("../safety/stories/choices");
  const base = { childId: null, householdId: null, feature: "story" as const, market: "baseline" };

  const runs = [
    { ageBand: "5-6" as const, locale: "en" as const, r: ["fox", "forest", "worried", "lost_toy"] },
    { ageBand: "10-12" as const, locale: "en" as const, r: ["dragon", "space", "jealous", "big_race"] },
    { ageBand: "7-9" as const, locale: "ar" as const, r: ["penguin", "beach", "lonely", "new_friend"] },
  ].slice(0, Number(nStories));
  for (const run of runs) {
    const t = performance.now();
    const recipe = { hero: choice("hero", run.r[0])!, place: choice("place", run.r[1])!, feeling: choice("feeling", run.r[2])!, adventure: choice("adventure", run.r[3])! };
    const s = await writeStory({ ...base, ageBand: run.ageBand, locale: run.locale }, recipe);
    console.log(`\n=== ${run.locale} ${run.ageBand} ${run.r.join("/")} → ${s.source} in ${Math.round(performance.now() - t)} ms`);
    console.log(`"${s.title}"  look: ${s.heroLook}`);
    s.pages.forEach((p, i) => console.log(`${i + 1}. [${p.feelio}] ${p.text}\n   scene: ${p.scene}`));
    console.log(`Q: ${s.question.text} → ${s.question.answers.join(" | ")}`);
  }

  if (nIdeas !== "0") {
    const ideas: [Parameters<typeof mapIdea>[1], string][] = [
      ["hero", "a rainbow unicorn who loves pizza"],
      ["hero", "Elsa from Frozen"],
      ["hero", "my little brother"],
      ["place", "a candy mountain"],
      ["adventure", "a monster that eats everybody"],
      ["adventure", "looking for treasure"],
    ];
    for (const [slot, said] of ideas) {
      const t = performance.now();
      const r = await mapIdea({ ...base, ageBand: "7-9", locale: "en" }, slot, said);
      console.log(`\nidea ${slot}: "${said}" → ${r.ok ? `${r.choice.en} / ${r.choice.ar} | ${r.choice.describe}` : `declined (${r.reason})`} [${Math.round(performance.now() - t)} ms]`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
