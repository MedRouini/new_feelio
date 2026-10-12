// The SPEC §5.2 "done when" review (D-070): makes N varied stories with their pictures through the real
// safety layer and writes a local review page (.data/review/index.html, git-ignored) for the owner to
// judge: exactly 4 pages, safe, and visually consistent characters. Synthetic only (no child).
// Cost: about $0.09 per story (text + 5 pictures + checks); about 1 minute each.
//   npx tsx --conditions=react-server scripts/story-review.ts [count=20]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function main() {
  const count = Number(process.argv[2] ?? 20);
  const { writeStory } = await import("../safety/stories/write");
  const { makePicture } = await import("../safety/images");
  const { CHOICES } = await import("../safety/stories/choices");
  const out = join(".data", "review");
  mkdirSync(out, { recursive: true });
  const bands = ["5-6", "7-9", "10-12"] as const;
  const sections: string[] = [];
  for (let n = 0; n < count; n++) {
    const pick = <T,>(a: T[], k: number) => a[(n * k + 3) % a.length];
    const recipe = { hero: pick(CHOICES.hero, 3), place: pick(CHOICES.place, 5), feeling: pick(CHOICES.feeling, 7), adventure: pick(CHOICES.adventure, 1) };
    const locale = n % 4 === 3 ? "ar" : "en";
    const ctx = { childId: null, householdId: null, feature: "story" as const, market: "baseline", ageBand: bands[n % 3], locale: locale as "en" | "ar" };
    const t = performance.now();
    const story = await writeStory(ctx, recipe);
    const seed = 1000 + n;
    const pics = [await makePicture({ heroLook: story.heroLook, scene: story.source === "fallback" ? story.pages[0].scene : recipe.place.describe, kind: "cover", seed })];
    for (const p of story.pages) pics.push(await makePicture({ heroLook: story.heroLook, scene: p.scene, kind: "page", seed }));
    const imgs = pics.map((p, i) => {
      if (!p.ok) return `<div class="miss">${i === 0 ? "cover" : `page ${i}`}: ${p.reason}</div>`;
      const f = `${n}-${i}.jpg`;
      writeFileSync(join(out, f), p.bytes);
      return `<img src="${f}" alt="">`;
    });
    sections.push(`<section><h2>${n + 1}. ${esc(story.title)} <small>(${story.source}, ${ctx.ageBand}, ${locale}, ${Math.round((performance.now() - t) / 1000)} s)</small></h2>
<p class="meta">${esc([recipe.hero.en, recipe.place.en, recipe.feeling.en, recipe.adventure.en].join(" · "))} · look: ${esc(story.heroLook)}</p>
<div class="row">${imgs[0]}</div>
${story.pages.map((p, i) => `<div class="page">${imgs[i + 1]}<p dir="auto">${esc(p.text)}</p><small>Feelio: ${p.feelio} · scene: ${esc(p.scene)}</small></div>`).join("\n")}
<p dir="auto"><b>${esc(story.question.text)}</b> ${story.question.answers.map(esc).join(" / ")}</p></section>`);
    console.log(`${n + 1}/${count}: "${story.title}" (${story.source}), pictures ${pics.filter((p) => p.ok).length}/5`);
    writeFileSync(join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>Story review</title><style>body{font:16px system-ui;margin:24px;background:#f3ecff;color:#322a6a}section{background:#fff;border-radius:16px;padding:16px;margin:0 0 24px}.row img{width:320px;border-radius:12px}.page{display:grid;grid-template-columns:320px 1fr;gap:12px;align-items:center;margin:8px 0}.page img{width:320px;border-radius:12px}.miss{width:320px;height:240px;display:grid;place-items:center;background:#eee;border-radius:12px}.meta,small{color:#4b4380}</style><h1>Story review (${sections.length} stories)</h1>${sections.join("\n")}`);
  }
  console.log(`Open ${join(out, "index.html")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
