// Pre-generates Feelio's fixed voice lines as static MP3 files (D-037, CR-11: fixed phrases are static
// audio, generated once, reviewed, never per use). Lives under safety/ because it calls a provider.
//
//   npx tsx safety/voice-lines/generate.ts                 → dry run: lines, characters, estimated credits
//   npx tsx safety/voice-lines/generate.ts --yes           → generates only new or changed lines
//   npx tsx safety/voice-lines/generate.ts --locale en     → one language only (Arabic waits for a voice, D-064)
//
// Cost guard: Multilingual v2 (about 1 credit/char; the owner found Flash not smooth enough, D-064),
// unchanged lines are skipped (text and voice hash in the lock file), nothing is called without --yes.
// Adults-only testing until ElevenLabs approves under-18 use (D-005).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VOICE_LINES } from "./lines";

const MODEL = "eleven_multilingual_v2";
const FORMAT = "mp3_44100_64";
const LOCK = "content/voice-lines.lock.json";
const CREDITS_PER_CHAR = { low: 1, high: 1 };

function loadEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}

function message(locale: "en" | "ar", path: string): string {
  const m = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  return path.split("+").map((p) => p.split(".").reduce((o: Record<string, unknown>, k) => o[k] as Record<string, unknown>, m) as unknown as string).join(" ");
}

/** Windows sometimes holds the lock file for a moment (a scanner or an editor): retry, so no line is paid for twice. */
async function writeWithRetry(file: string, data: string) {
  for (let i = 0; ; i++) {
    try {
      return writeFileSync(file, data);
    } catch (e) {
      if (i >= 5) throw e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
}

async function main() {
  loadEnv();
  const go = process.argv.includes("--yes");
  const lock: Record<string, Record<string, string>> = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : { en: {}, ar: {} };
  const todo: { locale: "en" | "ar"; key: string; text: string; hash: string }[] = [];

  const only = process.argv.includes("--locale") ? process.argv[process.argv.indexOf("--locale") + 1] : null;
  const voices = { en: process.env.ELEVENLABS_VOICE_ID_EN, ar: process.env.ELEVENLABS_VOICE_ID_AR };
  for (const locale of (["en", "ar"] as const).filter((l) => !only || l === only)) {
    for (const [key, path] of Object.entries(VOICE_LINES)) {
      const text = message(locale, path);
      // The voice is part of the hash, so changing the voice regenerates the lines.
      const hash = createHash("sha256").update(`${MODEL}|${voices[locale] ?? ""}|${text}`).digest("hex").slice(0, 16);
      const file = join("public/audio", locale, `${key}.mp3`);
      if (lock[locale]?.[key] === hash && existsSync(file)) continue;
      todo.push({ locale, key, text, hash });
    }
  }
  const chars = todo.reduce((n, l) => n + l.text.length, 0);
  console.log(`${todo.length} line(s) to generate, ${chars} characters ≈ ${Math.round(chars * CREDITS_PER_CHAR.low)}–${Math.round(chars * CREDITS_PER_CHAR.high)} credits (model ${MODEL}).`);
  if (!todo.length) return;
  if (!go) {
    console.log("Dry run. Re-run with --yes to generate.");
    return;
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  for (const l of todo) {
    const voice = voices[l.locale];
    if (!voice) throw new Error(`ELEVENLABS_VOICE_ID_${l.locale.toUpperCase()} is not set (choose a voice first)`);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${FORMAT}`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text: l.text, model_id: MODEL, language_code: l.locale }),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status} for ${l.locale}/${l.key} (no details logged)`);
    mkdirSync(join("public/audio", l.locale), { recursive: true });
    writeFileSync(join("public/audio", l.locale, `${l.key}.mp3`), Buffer.from(await res.arrayBuffer()));
    (lock[l.locale] ??= {})[l.key] = l.hash;
    await writeWithRetry(LOCK, JSON.stringify(lock, null, 2) + "\n");
    console.log(`  ✓ ${l.locale}/${l.key}`);
  }
  console.log("Done. Listen to every line before it ships (review is required).");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
