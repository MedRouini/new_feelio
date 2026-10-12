import "server-only";
import { env } from "@/platform/env";
import { ProviderError } from "../providers/together";

// Story narration (D-070): Feelio reads a page of the child's story in its own voice (Jessica, D-064),
// with the same smooth model the owner chose for the fixed lines. The text was already checked by the
// safety layer when the story was written. Opt-in, made once per page and kept with the story, capped
// per child per day (child/narration.ts). English only until an Arabic voice is chosen (D-064).
const MODEL = "eleven_multilingual_v2";
const FORMAT = "mp3_44100_64";

export function narrationVoice(locale: "en" | "ar"): string | null {
  const e = env();
  return (locale === "en" ? e.ELEVENLABS_VOICE_ID_EN : e.ELEVENLABS_VOICE_ID_AR) ?? null;
}

export async function narrate(text: string, locale: "en" | "ar"): Promise<Buffer> {
  const key = env().ELEVENLABS_API_KEY;
  const voice = narrationVoice(locale);
  if (!key || !voice) throw new ProviderError("narration is not configured");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, language_code: locale }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new ProviderError(`ElevenLabs TTS returned ${res.status}`, res.status);
  return Buffer.from(await res.arrayBuffer());
}
