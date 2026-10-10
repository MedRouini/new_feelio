// Builds web-ready copies of every APPROVED asset listed in assets/manifest.json.
//  - Never edits the source art; outputs go to public/generated/ (git-ignored).
//  - D-027: on transparent PNGs, alpha >= 240 -> 255 and alpha <= 8 -> 0 (ChatGPT export clean-up).
//  - Writes design/asset-index.generated.json (sizes per asset) and prints the weight per file.
// Run: npm run assets:build (also runs before dev and build).
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import sharp from "sharp";

type ManifestEntry = { id: string; file: string; kind: string; approved: boolean; sha256?: string };

const OUT_DIR = "public/generated";
const INDEX_FILE = "design/asset-index.generated.json";
const WIDTHS: Record<string, number[]> = {
  map: [768, 1024, 1536],
  default: [128, 256, 512, 1024],
};

function category(file: string): string {
  return file.split("/")[2] ?? "misc"; // assets/approved/<category>/<name>.png
}

async function normaliseAlpha(input: Buffer): Promise<ReturnType<typeof sharp>> {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= 240) data[i] = 255;
    else if (data[i] <= 8) data[i] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}

async function main() {
  const manifest = JSON.parse(readFileSync("assets/manifest.json", "utf8")) as { assets: ManifestEntry[] };
  const entries = manifest.assets.filter((a) => a.approved && a.file.startsWith("assets/approved/"));
  const index: Record<string, { src: Record<number, string>; width: number; height: number; transparent: boolean }> = {};
  let total = 0;

  for (const a of entries) {
    const src = readFileSync(a.file);
    const meta = await sharp(src).metadata();
    const transparent = meta.hasAlpha === true;
    const cat = category(a.file);
    const name = parse(a.file).name;
    const widths = (WIDTHS[cat] ?? WIDTHS.default).filter((w) => w <= (meta.width ?? 0));
    const base = transparent ? await normaliseAlpha(src) : sharp(src);
    const baseBuf = await base.png().toBuffer();
    index[name] = { src: {}, width: meta.width ?? 0, height: meta.height ?? 0, transparent };

    for (const w of widths) {
      const rel = `${cat}/${name}-${w}.webp`;
      const out = join(OUT_DIR, rel);
      mkdirSync(dirname(out), { recursive: true });
      await sharp(baseBuf)
        .resize({ width: w })
        .webp({ quality: cat === "map" ? 80 : 85, alphaQuality: 90, effort: 5 })
        .toFile(out);
      const kb = statSync(out).size / 1024;
      total += kb;
      index[name].src[w] = `/generated/${rel}`;
      console.log(`${rel.padEnd(44)} ${kb.toFixed(0).padStart(5)} KB`);
    }
  }

  mkdirSync(dirname(INDEX_FILE), { recursive: true });
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2) + "\n");
  console.log(`\n${Object.keys(index).length} assets, ${total.toFixed(0)} KB total across all sizes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
