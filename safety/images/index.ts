import "server-only";
import config from "@/content/safety/config.json";
import { ProviderError, generateImage, visionJson } from "../providers/together";
import { vettedT0 } from "../stories/vetted";

// Story pictures (SAFETY_POLICY §4.2, SR-19, D-070). The prompt is assembled from a fixed brand style
// block, the vetted hero look and the vetted page scene: never the child's words. The provider's NSFW
// checker stays on; then a vision model checks every picture before anyone sees it (SR-13). A blocked
// or failed picture is tried once more, then the page shows its approved fallback art instead.

export const IMAGE_PROMPT_VERSION = "img-v0.3";

/** The brand's shared style block (docs/ASSET_PROTOCOL.md), adapted for story pages. */
const STYLE =
  "A full-bleed illustration for a children's picture book: just the picture, not a page, not a book, not a poster. Flat 2D vector-style illustration, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Warm, calm and safe; culturally neutral.";
const RULES = "Only animals, friendly creatures, plants, objects and places. No people. Absolutely no text anywhere: no letters, no numbers, no words, no writing, no signs, no logos, no watermark. Nothing scary.";

export type PictureResult = { ok: true; url: string; bytes: Buffer; contentType: string; prompt: string } | { ok: false; reason: "blocked" | "unavailable" };

export function picturePrompt(heroLook: string, scene: string, kind: "cover" | "page"): string {
  // The cover is a character portrait: the hero alone on a calm background, so that as the style
  // reference for the pages it carries the character only, not a whole scene.
  const what =
    kind === "cover"
      ? `The hero of the story alone, front view, centred, smiling, full body: ${heroLook}. Nobody else in the picture. A soft, plain pastel background with only a gentle hint of the place: ${scene}.`
      : `${scene} The hero always looks exactly like this: ${heroLook}.`;
  return `${STYLE} ${what} ${RULES}`;
}

type Verdict = { people: boolean; scary_or_unsafe: boolean; sexual: boolean; text: boolean; matches_style: boolean };
const VERDICT = {
  type: "object",
  additionalProperties: false,
  properties: {
    people: { type: "boolean" },
    scary_or_unsafe: { type: "boolean" },
    sexual: { type: "boolean" },
    text: { type: "boolean" },
    matches_style: { type: "boolean" },
  },
  required: ["people", "scary_or_unsafe", "sexual", "text", "matches_style"],
};
const CHECK_SYSTEM =
  "You check pictures for a children's storybook app (ages 5-12) before a child sees them. Look carefully and answer only with the JSON object. people: any human or human-like person (including cartoon children or adults). scary_or_unsafe: anything frightening, violent, dangerous, injured, weapons or blood. sexual: anything sexual, nudity or suggestive. text: visible letters, words or numbers. matches_style: a soft cute cartoon picture-book style.";

/** The second check of every generated picture (fail closed). */
export async function checkPicture(url: string): Promise<{ ok: boolean; soft: boolean }> {
  try {
    const v = await visionJson<Verdict>({
      model: config.images.checker.model,
      system: CHECK_SYSTEM,
      question: "Check this picture.",
      imageUrl: url,
      schema: VERDICT,
      maxTokens: config.images.checker.maxTokens,
      timeoutMs: config.images.checker.timeoutMs,
    });
    if (process.env.FEELIO_DEBUG_SAFETY === "1") console.info("[picture check]", JSON.stringify(v));
    // Writing in a picture is never shown (it comes out as gibberish); unsafe content never.
    if (v.sexual || v.people || v.scary_or_unsafe || v.text) return { ok: false, soft: false };
    // Only an off-style picture is a soft miss: worth one more try, usable if the retry is no better.
    return { ok: v.matches_style, soft: true };
  } catch (e) {
    if (process.env.FEELIO_DEBUG_SAFETY === "1") console.info("[picture check] error", e instanceof Error ? e.message : e);
    return { ok: false, soft: false };
  }
}

export async function makePicture(opts: { heroLook: string; scene: string; kind: "cover" | "page"; reference?: string; seed?: number }): Promise<PictureResult> {
  const prompt = picturePrompt(opts.heroLook, opts.scene, opts.kind);
  // The assembled prompt passes the same deterministic checks as its parts (no people, no writing).
  const parts = vettedT0(`${opts.heroLook} ${opts.scene}`, "scene");
  if (!parts.ok) return { ok: false, reason: "blocked" };
  let lastSoft: Extract<PictureResult, { ok: true }> | null = null;
  let providerDown = 0;
  let waits = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = await generateImage({
        model: config.images.generator.model,
        prompt,
        width: config.images.generator.width,
        height: config.images.generator.height,
        steps: config.images.generator.steps,
        seed: opts.seed !== undefined ? opts.seed + attempt : undefined,
        referenceImages: opts.reference ? [opts.reference] : undefined,
        timeoutMs: config.images.generator.timeoutMs,
      });
      if ("blocked" in out) continue;
      const check = await checkPicture(out.url);
      if (check.ok) return { ok: true, ...out, prompt };
      // Only a soft miss (writing, style) may be used if the retry is no better; never an unsafe one.
      if (check.soft) lastSoft = { ok: true, ...out, prompt };
    } catch (e) {
      // Rate limited: wait and try again without spending an attempt (a few times at most).
      if (e instanceof ProviderError && e.status === 429 && waits < 4) {
        waits++;
        await new Promise((r) => setTimeout(r, 2500 * waits));
        attempt--;
        continue;
      }
      // other provider error or timeout: try once more
      if (process.env.FEELIO_DEBUG_SAFETY === "1") console.info("[picture] provider error", e instanceof Error ? e.message : e);
      providerDown++;
    }
  }
  if (lastSoft) return lastSoft;
  // Both attempts failed at the provider (down, timed out, or not permitted): not a content verdict.
  return { ok: false, reason: providerDown === 2 ? "unavailable" : "blocked" };
}
