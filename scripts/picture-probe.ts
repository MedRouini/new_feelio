// Picture pipeline probe (D-070): writes one story, then makes its cover and 4 pages through the real
// safety layer (template prompt, provider NSFW checker, vision check), and saves them to a folder for
// review. Synthetic only. About $0.08 of Together credits per story.
//   npx tsx --conditions=react-server scripts/picture-probe.ts <outDir> [hero place feeling adventure] [--cover-only]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
}

async function main() {
  const [out, hero = "fox", place = "forest", feeling = "worried", adventure = "lost_toy"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!out) throw new Error("usage: picture-probe.ts <outDir> [hero place feeling adventure]");
  mkdirSync(out, { recursive: true });
  const { writeStory } = await import("../safety/stories/write");
  const { makePicture } = await import("../safety/images");
  const { choice } = await import("../safety/stories/choices");
  const ctx = { childId: null, householdId: null, feature: "story" as const, market: "baseline", ageBand: "7-9" as const, locale: "en" as const };
  const recipe = { hero: choice("hero", hero)!, place: choice("place", place)!, feeling: choice("feeling", feeling)!, adventure: choice("adventure", adventure)! };
  const story = await writeStory(ctx, recipe);
  console.log(`"${story.title}" (${story.source}); look: ${story.heroLook}`);
  const seed = Math.floor(Math.random() * 1e6);

  let t = performance.now();
  const cover = await makePicture({ heroLook: story.heroLook, scene: recipe.place.describe, kind: "cover", seed });
  console.log(`cover: ${cover.ok ? "ok" : cover.reason} in ${Math.round(performance.now() - t)} ms`);
  if (!cover.ok) return;
  writeFileSync(join(out, "0-cover.jpg"), cover.bytes);
  if (process.argv.includes("--cover-only")) return;

  t = performance.now();
  const pages = [];
  for (const p of story.pages) pages.push(await makePicture({ heroLook: story.heroLook, scene: p.scene, kind: "page", seed }));
  console.log(`4 pages one after another: ${Math.round(performance.now() - t)} ms`);
  pages.forEach((p, i) => {
    console.log(`page ${i + 1}: ${p.ok ? "ok" : p.reason}  | ${story.pages[i].scene}`);
    if (p.ok) writeFileSync(join(out, `${i + 1}-page.jpg`), p.bytes);
  });
  writeFileSync(join(out, "story.json"), JSON.stringify(story, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
