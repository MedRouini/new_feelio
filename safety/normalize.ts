// Text normalisation before the deterministic rules (SAFETY_POLICY §2.2). Children misspell, voice
// transcription mishears, and people who want to get around filters space letters out or swap them
// for digits. Each variant is matched separately, so a rule written once catches all of them.

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };
const TATWEEL = String.fromCharCode(0x0640);
const ARABIC_ZERO = 0x0660;

/** Arabic letter forms that vary in children's typing and in transcripts, folded to one form. */
export function foldArabic(s: string): string {
  return s
    .replace(/\p{M}/gu, "") // harakat, tanween, shadda, sukun and every other combining mark
    .split(TATWEEL)
    .join("")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - ARABIC_ZERO));
}

/** The base form every rule is written against: NFKC, lower case, folded Arabic, tidy spacing, no long letter runs. */
export function normalize(text: string): string {
  return foldArabic(text.normalize("NFKC").toLowerCase())
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/(\p{L})\1{2,}/gu, "$1$1") // "sooooo" → "soo"
    .replace(/[^\p{L}\p{N}'@$!?.,\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const leetWord = (w: string) => (/\p{L}/u.test(w) && /[0-9@$!]/.test(w) ? w.replace(/[013457@$!]/g, (c) => LEET[c] ?? c) : w);

/**
 * Variants matched by the rules: the base form; without apostrophes; with stretched letters reduced
 * to one ("waaaant" → "want"); leetspeak decoded ("k1ll" → "kill"); spaced-out letters joined
 * ("k i l l" → "kill"); texting shorthand expanded ("i want 2 d1e" → "i want to die"). Arabizi
 * (Arabic in Latin letters, with digits for sounds: "7", "3", "2") keeps its digits in the base form
 * and has its own rules, so it is never leet-decoded by mistake.
 */
export function variants(text: string): string[] {
  const base = normalize(text);
  const out = new Set([base]);
  out.add(base.replace(/'/g, ""));
  // (from the raw text: the base form already shortened long runs to two letters)
  out.add(normalize(text.toLowerCase().replace(/(\p{L})\1{2,}/gu, "$1")));
  // leetspeak only inside words that also contain letters (keeps phone numbers and Arabizi intact)
  out.add(base.replace(/\S+/g, leetWord));
  // runs of 3+ single characters are joined: "k i l l m y s e l f" → "killmyself"
  out.add(base.replace(/(?:^|\s)((?:\p{L}\s){2,}\p{L})(?=\s|$)/gu, (m) => " " + m.replace(/\s/g, "")).trim());
  const texting = base.replace(/\S+/g, (w) => TEXTING[w] ?? w);
  out.add(texting);
  out.add(texting.replace(/\S+/g, leetWord));
  return [...out];
}

const TEXTING: Record<string, string> = {
  "2": "to",
  "4": "for",
  u: "you",
  ur: "your",
  r: "are",
  im: "i'm",
  wanna: "want to",
  gonna: "going to",
  dont: "don't",
  cant: "can't",
  wont: "won't",
  pls: "please",
  plz: "please",
  ppl: "people",
  bc: "because",
  cuz: "because",
};
