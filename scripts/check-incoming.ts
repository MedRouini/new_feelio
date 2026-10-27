// Checks a batch of delivered images waiting for review (assets/incoming/<batch>/) against its job list
// (assets/requests/<batch>/jobs.json): each file exists, has the exact size, and is transparent when it
// should be. Does not approve anything: Claude Code still looks at every file (ASSET_PROTOCOL).
//   npx tsx scripts/check-incoming.ts batch6
import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";

type Job = { asset_name: string; output_path: string; width: number; height: number; transparent_background: boolean };

async function main() {
  const batch = process.argv[2];
  if (!batch || !/^[a-z0-9-]+$/.test(batch)) throw new Error("usage: npx tsx scripts/check-incoming.ts <batch>");
  const jobs = JSON.parse(readFileSync(`assets/requests/${batch}/jobs.json`, "utf8")) as Job[];
  let failed = 0;
  for (const j of jobs) {
    const problems: string[] = [];
    if (!existsSync(j.output_path)) problems.push("missing");
    else {
      const img = sharp(j.output_path);
      const meta = await img.metadata();
      if (meta.format !== "png") problems.push(`not a PNG (${meta.format})`);
      if (meta.width !== j.width || meta.height !== j.height) problems.push(`size ${meta.width}x${meta.height}, expected ${j.width}x${j.height}`);
      if (j.transparent_background) {
        if (!meta.hasAlpha) problems.push("no transparency");
        else {
          const { data, info } = await img.ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
          const clear = data.reduce((n, a) => n + (a < 8 ? 1 : 0), 0) / (info.width * info.height);
          if (clear < 0.15) problems.push(`only ${(clear * 100).toFixed(0)}% transparent (background missing?)`);
        }
      }
    }
    if (problems.length) failed++;
    console.log(`${problems.length ? "FAIL" : "ok  "} ${j.asset_name}${problems.length ? ": " + problems.join("; ") : ""}`);
  }
  console.log(`\n${jobs.length - failed}/${jobs.length} ok`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
