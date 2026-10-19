import { checkInputT0 } from "../pipeline";

// What the agent heard, before Feelio answers (D-077). The microphone stays open during a game, so the
// agent can hear silence (its turn timeout sends "..."), small sounds like "hmm" or a breath, and
// Feelio's own recorded game lines coming back through the speakers. None of these is the child
// talking to Feelio: during a game they get no reply, and an echo never stays in the conversation.
// Pure; the proxy and its tests share it.

/** Nothing said: the agent's own silence marker, or only punctuation. */
export function isSilence(text: string): boolean {
  return /^[\s.…,!?؟،-]*$/.test(text);
}

const FILLER = new Set(["hmm", "hm", "mm", "mmm", "uh", "um", "umm", "ah", "ahh", "oh", "huh", "ha", "haa", "whoosh", "shh", "phew", "ok", "okay", "آه", "اه", "امم", "همم", "اوه"]);

/** Only small sounds (a breath, "hmm"): fine to let pass while the child is busy with a game. */
export function isFiller(text: string): boolean {
  const words = tokens(text);
  return words.length > 0 && words.length <= 3 && words.every((w) => FILLER.has(w));
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Feelio's own recorded line picked up by the microphone: almost every word heard is in one of the
 * lines (at least two words, so a child's single "in" or "yes" is never mistaken for one).
 */
export function isEcho(text: string, lines: readonly string[]): boolean {
  const heard = tokens(text);
  if (heard.length < 2) return false;
  return lines.some((line) => {
    const words = new Set(tokens(line));
    const hits = heard.filter((w) => words.has(w)).length;
    return hits / heard.length >= 0.8 && hits / words.size >= 0.5;
  });
}

/**
 * Whether Feelio stays quiet for what the agent just heard: an echo of its own recorded lines, and
 * during a game, silence or a small sound. Anything the safety rules notice (a crisis word, personal
 * information, anything at all) always goes through the full pipeline instead, so this shortcut can
 * never swallow a child asking for help.
 */
export function staysQuiet(text: string, opts: { playing: boolean; lines: readonly string[] }): boolean {
  if (checkInputT0(text).findings.length) return false;
  return isEcho(text, opts.lines) || (opts.playing && (isSilence(text) || isFiller(text)));
}

/** Earlier turns that were never the child talking (silence, an echo): left out of Feelio's memory. */
export function notTalk(text: string, lines: readonly string[]): boolean {
  return !checkInputT0(text).findings.length && (isSilence(text) || isEcho(text, lines));
}
