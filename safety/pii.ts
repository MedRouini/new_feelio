import { foldArabic } from "./normalize";

// Personal information is redacted before anything is stored or logged (SR-25, CR-6). Shapes, not
// names: phone numbers, emails, links, and what follows "my address is", "I live at", "my full name
// is", "my school is called". The placeholder keeps the sentence readable for review.

export const REDACTED = "[private]";

const SHAPES: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/gu, // email
  /\bhttps?:\/\/\S+|\bwww\.\S+/giu, // link
  /(?:\+|00)?\d[\d\s().-]{6,}\d/gu, // phone-like: 8+ digits with separators
  // (?<![\p{L}\p{N}]) instead of \b, which only knows ASCII letters and so misses Arabic
  /(?<![\p{L}\p{N}])(?:my (?:home )?address is|i live (?:at|on)|عنواني|عنوان بيتي|اسكن في)\s+[^.,!?\n]{2,60}/giu,
  /(?<![\p{L}\p{N}])(?:my (?:full|real|last) name is|اسمي الكامل)\s+[\p{L}'-]+(?:\s+[\p{L}'-]+){0,2}/giu,
  /(?<![\p{L}\p{N}])(?:my school is called|my school'?s name is|مدرستي اسمها)\s+[\p{L}'-]+(?:\s+[\p{L}'-]+){0,3}/giu,
  /\bi go to\s+[\p{L}'-]+(?:\s+[\p{L}'-]+){0,3}\s+school\b/giu,
];

/** Returns the text with personal information replaced, and whether anything was found. */
export function redact(text: string): { text: string; found: boolean } {
  let found = false;
  // Arabic-Indic digits are folded first so phone numbers in either script are caught.
  let out = foldArabic(text);
  for (const re of SHAPES) {
    out = out.replace(re, (m) => {
      found = true;
      // keep the lead-in words ("my address is") so a reviewer understands the sentence
      const lead = m.match(/^(?:my (?:home )?address is|i live (?:at|on)|my (?:full|real|last) name is|my school is called|my school'?s name is|i go to|عنواني|عنوان بيتي|اسكن في|اسمي الكامل|مدرستي اسمها)/iu);
      return lead ? `${lead[0]} ${REDACTED}${/school$/i.test(m) ? " school" : ""}` : REDACTED;
    });
  }
  return { text: out, found };
}
