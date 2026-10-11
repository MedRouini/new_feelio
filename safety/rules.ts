import raw from "@/content/safety/rules.json";
import { foldArabic, normalize, variants } from "./normalize";
import type { ActorClass, Category, Finding, Severity } from "./types";

// T0: deterministic rules (SAFETY_POLICY §2.2). Fast (well under 5 ms), high recall, no model. The
// phrase lists are reviewed data in content/safety/rules.json; this file only compiles and runs them.

type RuleData = { id: string; category: string; severity: number; patterns: string[]; actor?: string };
type Compiled = { id: string; category: Category; severity: Severity; actor?: ActorClass; res: RegExp[] };

// JavaScript's \b only knows ASCII letters, so it fails on Arabic: replace it with a Unicode one.
const B = "(?:(?<=[\\p{L}\\p{N}])(?![\\p{L}\\p{N}])|(?<![\\p{L}\\p{N}])(?=[\\p{L}\\p{N}]))";
// Arabic words take attached prefixes (and, so, with, to, the): "الانتحار", "وبابا". A pattern that
// starts with an Arabic word accepts them, so rules are written for the bare word.
const ARABIC_PREFIX = "(?:و|ف|ب|ل|ال|وال|بال|فال|لل)?";
const STARTS_ARABIC = /^\\b\(?\p{Script=Arabic}/u;

export function compilePattern(p: string): RegExp {
  let src = foldArabic(p);
  if (STARTS_ARABIC.test(src)) src = "\\b" + ARABIC_PREFIX + src.slice(2);
  return new RegExp(src.replace(/\\b/g, B), "giu");
}

const compile = (r: RuleData): Compiled => ({
  id: r.id,
  category: r.category as Category,
  severity: r.severity as Severity,
  actor: r.actor as ActorClass | undefined,
  res: r.patterns.map(compilePattern),
});

const INPUT = (raw.input as RuleData[]).map(compile);
const OUTPUT = (raw.output as RuleData[]).map(compile);
const BENIGN = raw.benign.flatMap((b) => b.patterns.map(compilePattern));
const ACTORS: [ActorClass, RegExp[]][] = (
  ["household_caregiver", "other_known_adult", "stranger_online", "stranger_offline", "peer"] as const
).map((a) => [a, (raw.actors[a] as string[]).map(compilePattern)]);

export const RULES_VERSION = raw.version;

const test = (re: RegExp, s: string) => {
  re.lastIndex = 0;
  return re.test(s);
};

/** Benign look-alikes ("I'm dying to go to the park", "kill the lights") are blanked out first. */
function withoutBenign(s: string): string {
  return BENIGN.reduce((acc, re) => acc.replace(re, " "), s);
}

/**
 * Who a disclosure is about (SAFETY_POLICY §5). Household words win over everything, and nothing
 * recognisable means "unknown": both mean the account holder is never notified.
 */
export function actorOf(text: string): ActorClass {
  const s = normalize(text);
  for (const [actor, res] of ACTORS) if (res.some((re) => test(re, s))) return actor;
  return "unknown";
}

const NEEDS_ACTOR = new Set<Category>(["abuse_disclosure", "grooming", "sextortion", "sexual_minor"]);

function run(rules: Compiled[], text: string, benign: boolean): Finding[] {
  const forms = variants(text).map((v) => (benign ? withoutBenign(v) : v));
  const best = new Map<Category, Finding>();
  for (const rule of rules) {
    if (!forms.some((f) => rule.res.some((re) => test(re, f)))) continue;
    const prev = best.get(rule.category);
    if (!prev || rule.severity > prev.severity) {
      best.set(rule.category, { category: rule.category, severity: rule.severity, source: "t0", rule: rule.id, actorClass: rule.actor });
    }
  }
  const out = [...best.values()];
  // A rule can fix the actor (bullying is about peers); otherwise it is read from the words.
  for (const f of out) if (NEEDS_ACTOR.has(f.category) && !f.actorClass) f.actorClass = actorOf(text);
  return out;
}

/** T0 on what the child said or typed. */
export function t0Input(text: string): Finding[] {
  return run(INPUT, text, true);
}

/** T0 on one sentence the model wrote, before it reaches the child. */
export function t0Output(text: string): Finding[] {
  return run(OUTPUT, text, false);
}
