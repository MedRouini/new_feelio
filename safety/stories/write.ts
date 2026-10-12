import "server-only";
import config from "@/content/safety/config.json";
import fallback from "@/content/stories/fallback.json";
import { configuredClassifier } from "../classify";
import { recordDecision } from "../events";
import { checkOutput } from "../pipeline";
import { chatJson } from "../providers/together";
import { route } from "../router";
import type { AgeBand, Finding, Locale, SafetyCtx } from "../types";
import type { StoryRecipe } from "./choices";
import { vetted, vettedT0 } from "./vetted";

// The story writer (SPEC §5.2, docs/STORIES.md, D-070). Input: four vetted choices only (never the
// child's words). Output, by JSON schema: a title, the hero's look (the character sheet for the
// pictures), exactly 4 pages (beginning → development → resolution) each with text, a picture scene
// and Feelio's mood as narrator, and a gentle reflection question. Every text the child sees or hears
// passes the strict output check; every scene passes the picture-prompt check. A misfit is written
// once more; then a reviewed fallback story is used. Never padded, never shown unchecked.

export const STORY_PROMPT_VERSION = "story-v0.1";
export const FEELIO_MOODS = ["happy", "excited", "empathy", "calm", "thinking"] as const;
export type FeelioMood = (typeof FEELIO_MOODS)[number];

export type StoryPage = { text: string; scene: string; feelio: FeelioMood };
export type Story = {
  title: string;
  heroLook: string;
  pages: [StoryPage, StoryPage, StoryPage, StoryPage];
  question: { text: string; answers: [string, string, string] };
  source: "model" | "fallback";
};

const WORDS: Record<AgeBand, string> = {
  "5-6": "Each page has 2 or 3 very short, simple sentences (at most 30 words).",
  "7-9": "Each page has 3 or 4 short sentences (at most 50 words).",
  "10-12": "Each page has 4 or 5 sentences (at most 70 words).",
};
const LANG: Record<Locale, string> = {
  en: "Write the title, the pages and the question in simple English.",
  ar: "Write the title, the pages and the question in simple Modern Standard Arabic for children (with no English words).",
};

function system(ageBand: AgeBand, locale: Locale) {
  return [
    "You write short, warm picture-book stories for a children's app. The reader is a child.",
    "The story has exactly 4 pages: page 1 introduces the hero and the place; pages 2 and 3 are the adventure, where the hero feels the given feeling; page 4 is a kind resolution.",
    "Handle the feeling constructively: name it, show a helpful way to cope (breathing, talking to a friend or a grown-up, trying again, being kind), and never pretend difficult feelings must vanish or are bad.",
    "The characters are animals or friendly creatures only. No people at all. No violence, danger, scary detail, meanness that is not resolved kindly, or adult topics. Nothing about real places, brands or known characters.",
    WORDS[ageBand],
    LANG[locale],
    "heroLook: one English sentence (10 to 25 words) describing how the hero looks, for an illustrator: colours and simple shapes only.",
    "Each page has a 'scene' in English (10 to 30 words): what the picture shows (the hero, the place, objects, the mood). No people. Nothing with writing on it: no signs, banners, books, labels, letters or numbers.",
    "feelio: the mood of Feelio, the friendly narrator, for that page: happy, excited, empathy (caring, for sad or hard moments), calm or thinking.",
    "question: one gentle question about the story that helps the child think about feelings, and 3 short possible answers (2 to 6 words each), all kind.",
  ].join("\n");
}

const PAGE = {
  type: "object",
  additionalProperties: false,
  properties: { text: { type: "string" }, scene: { type: "string" }, feelio: { type: "string", enum: [...FEELIO_MOODS] } },
  required: ["text", "scene", "feelio"],
};
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    heroLook: { type: "string" },
    pages: { type: "array", items: PAGE, minItems: 4, maxItems: 4 },
    question: {
      type: "object",
      additionalProperties: false,
      properties: { text: { type: "string" }, answers: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } },
      required: ["text", "answers"],
    },
  },
  required: ["title", "heroLook", "pages", "question"],
};

function brief(r: StoryRecipe): string {
  return [`Hero: ${r.hero.describe}.`, `Place: ${r.place.describe}.`, `Feeling the hero has during the adventure: ${r.feeling.describe}.`, `Adventure: ${r.adventure.describe}.`].join("\n");
}

const MAX: Record<AgeBand, number> = { "5-6": 45, "7-9": 70, "10-12": 95 };
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Shape check: exactly 4 pages, non-empty fields, sensible lengths. */
export function fits(s: unknown, ageBand: AgeBand): s is Omit<Story, "source"> {
  const v = s as Story;
  if (!v || typeof v.title !== "string" || !v.title.trim() || v.title.length > 80) return false;
  if (typeof v.heroLook !== "string" || wordCount(v.heroLook) < 4 || wordCount(v.heroLook) > 40) return false;
  if (!Array.isArray(v.pages) || v.pages.length !== 4) return false;
  for (const p of v.pages) {
    if (!p || typeof p.text !== "string" || !p.text.trim() || wordCount(p.text) > MAX[ageBand]) return false;
    if (typeof p.scene !== "string" || wordCount(p.scene) < 4 || wordCount(p.scene) > 45) return false;
    if (!(FEELIO_MOODS as readonly string[]).includes(p.feelio)) return false;
  }
  if (!v.question || typeof v.question.text !== "string" || !v.question.text.trim()) return false;
  if (!Array.isArray(v.question.answers) || v.question.answers.length !== 3 || v.question.answers.some((a) => typeof a !== "string" || !a.trim())) return false;
  return true;
}

/** Every visible text and every scene, checked in parallel. Returns what the checks found. */
async function check(ctx: SafetyCtx, s: Omit<Story, "source">): Promise<{ ok: boolean; findings: Finding[]; why: (string | null)[] }> {
  const classifier = await configuredClassifier();
  const texts = [s.title, ...s.pages.map((p) => p.text), s.question.text, ...s.question.answers];
  // In small batches: firing every check at once trips the provider's rate limit, and a check that
  // doesn't answer fails closed (a needless fallback story).
  const outs = await inBatches(texts, 4, (t) => checkOutput({ ...ctx, feature: "story" }, t, { classifier, strict: true }));
  const scenes = await inBatches([s.heroLook, ...s.pages.map((p) => p.scene)], 4, (t) => vetted(ctx, t, "scene"));
  const why = [...outs.map((o, i) => (o.ok ? null : `text ${i}: ${o.findings.map((f) => f.category).join(",") || "check failed"}`)), ...scenes.map((ok, i) => (ok ? null : `scene ${i}${process.env.FEELIO_DEBUG_SAFETY === "1" ? ` (${vettedT0([s.heroLook, ...s.pages.map((p) => p.scene)][i], "scene").why ?? "model"})` : ""}`))].filter(Boolean);
  return { ok: outs.every((o) => o.ok) && scenes.every(Boolean), findings: outs.flatMap((o) => o.findings), why };
}

async function inBatches<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

export function fallbackStory(locale: Locale): Story {
  const f = fallback[locale] as Omit<Story, "source">;
  return { ...f, source: "fallback" };
}

export async function writeStory(ctx: SafetyCtx, recipe: StoryRecipe): Promise<Story> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { value } = await chatJson<unknown>({
        model: config.stories.writer.model,
        messages: [
          { role: "system", content: system(ctx.ageBand, ctx.locale) },
          { role: "user", content: brief(recipe) },
        ],
        schema: SCHEMA,
        maxTokens: config.stories.writer.maxTokens,
        temperature: config.stories.writer.temperature,
        timeoutMs: config.stories.writer.timeoutMs,
      });
      if (!fits(value, ctx.ageBand)) {
        if (process.env.FEELIO_DEBUG_SAFETY === "1") console.info("[story] shape misfit");
        continue;
      }
      const story = value as Omit<Story, "source">;
      const checked = await check(ctx, story);
      if (checked.ok) return { ...story, source: "model" };
      if (process.env.FEELIO_DEBUG_SAFETY === "1") console.info("[story] blocked", checked.why);
      // Counted like any blocked output (category and severity only, never the text).
      const r = route(checked.findings);
      await recordDecision({ ...ctx, feature: "story" }, { action: { type: "block", line: "fallback" }, primary: r.primary, findings: checked.findings, event: r.event, redacted: "" }, "output");
    } catch (e) {
      // timed out or malformed: try once more, then the fallback
      if (process.env.FEELIO_DEBUG_SAFETY === "1") console.info("[story] error", e instanceof Error ? e.message : e);
    }
  }
  return fallbackStory(ctx.locale);
}
