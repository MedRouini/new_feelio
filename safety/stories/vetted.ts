import "server-only";
import { configuredClassifier } from "../classify";
import { checkOutput } from "../pipeline";
import { t0Output } from "../rules";
import type { SafetyCtx } from "../types";

// Checks for the short vetted descriptions that reach the story writer and the picture model (D-070,
// SR-19, D-015). Besides the usual output rules: never people (the riskiest generative surface), never
// a known character or brand (someone else's art), never words or letters in a picture.

const PEOPLE =
  /\b(boys?|girls?|child(ren)?|kids?|toddlers?|bab(y|ies)|teen(ager)?s?|m[ae]n|wom[ae]n|lad(y|ies)|guys?|persons?|people|humans?|mom|mum|mommy|mummy|mother|dad|daddy|father|grand(ma|pa|mother|father)|teachers?|princess(es)?|princes?|kings?|queens?|wizards?|witch(es)?|fair(y|ies)|mermaids?|selfie|portrait)\b|ولد|بنت|طفل|أطفال|رجل|امرأة|إنسان|بشر|أميرة|أمير|ملك|ملكة|ساحرة|حورية/i;
const KNOWN_CHARACTERS =
  /\b(elsa|anna|frozen|olaf|spider-?man|bat-?man|super-?man|pikachu|pok[eé]mon|mickey|minnie|mario|luigi|sonic|barbie|peppa|bluey|paw ?patrol|minions?|shrek|hello ?kitty|disney|marvel|harry ?potter|hogwarts|stitch|simba|nemo|dora|batmobile|lego|roblox|minecraft|fortnite|sponge ?bob|winnie)\b/i;
const WRITING = /\b(text|letters?|words?|writing|written|signs?|banners?|posters?|labels?|books?|logo|brand|caption|numbers?)\b/i;

export type VettedKind = "description" | "scene";

/** Deterministic part: fast, model-free. */
export function vettedT0(text: string, kind: VettedKind): { ok: boolean; why?: string } {
  if (t0Output(text).some((f) => f.severity >= 2)) return { ok: false, why: "rules" };
  if (PEOPLE.test(text)) return { ok: false, why: "people" };
  if (KNOWN_CHARACTERS.test(text)) return { ok: false, why: "known_character" };
  if (kind === "scene" && WRITING.test(text)) return { ok: false, why: "writing" };
  return { ok: true };
}

/** Ordinary feelings are what these stories are about: in a picture description they are not a risk. */
const FEELINGS_ONLY = new Set(["sad_or_worried", "anger"]);

/** Full check: the rules above, then the strict model check (fail closed). */
export async function vetted(ctx: SafetyCtx, text: string, kind: VettedKind): Promise<boolean> {
  if (!vettedT0(text, kind).ok) return false;
  const classifier = await configuredClassifier();
  const out = await checkOutput({ ...ctx, feature: kind === "scene" ? "image_prompt" : "story" }, text, { classifier, strict: true });
  if (out.ok) return true;
  // A scene that only names a feeling ("the fox looks worried") passes; every other category still blocks,
  // and so does a failed check (no findings = the classifier didn't answer: fail closed).
  return kind === "scene" && out.findings.length > 0 && out.findings.every((f) => FEELINGS_ONLY.has(f.category));
}
