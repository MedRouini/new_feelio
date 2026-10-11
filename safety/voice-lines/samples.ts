// Voice audition: generates one sample per candidate voice with Feelio's real "hello" line, so the
// owner can listen and choose (D-037, D-064). Samples go to voice-samples/ (git-ignored, never shipped).
// Uses ElevenLabs credits (about 1 credit per character on Flash v2.5); prints usage before and after.
//   npx tsx safety/voice-lines/samples.ts en:VOICE_ID:name ar:VOICE_ID:name ...   (SAMPLE_MODEL=eleven_multilingual_v2 for smoother speech)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}

const API = "https://api.elevenlabs.io/v1";
const MODEL = process.env.SAMPLE_MODEL ?? "eleven_flash_v2_5";

async function used(key: string): Promise<number | null> {
  const r = await fetch(`${API}/user/subscription`, { headers: { "xi-api-key": key } });
  return r.ok ? ((await r.json()).character_count as number) : null;
}

async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  const lines = {
    en: JSON.parse(readFileSync("messages/en.json", "utf8")).child.onb.hello as string,
    ar: JSON.parse(readFileSync("messages/ar.json", "utf8")).child.onb.hello as string,
  };
  const before = await used(key);
  mkdirSync("voice-samples", { recursive: true });
  for (const arg of process.argv.slice(2)) {
    const [locale, voiceId, name] = arg.split(":") as ["en" | "ar", string, string];
    const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ text: lines[locale], model_id: MODEL, language_code: locale }),
    });
    if (!res.ok) {
      console.log(`${locale} ${name}: ElevenLabs ${res.status} (no details logged)`);
      continue;
    }
    const file = `voice-samples/${locale}-${name}.mp3`;
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`${locale} ${name}: ${file}`);
  }
  const after = await used(key);
  console.log(`Credits used by this run: ${before !== null && after !== null ? after - before : "unknown"}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
