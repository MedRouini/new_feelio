import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

type Tree = { [k: string]: string | Tree };
function keys(t: Tree, p = ""): string[] {
  return Object.entries(t).flatMap(([k, v]) => (k === "_meta" ? [] : typeof v === "string" ? [p + k] : keys(v, `${p}${k}.`)));
}

describe("messages (rtl-i18n-check)", () => {
  it("English and Arabic have exactly the same keys", () => {
    expect(keys(ar as Tree).sort()).toEqual(keys(en as Tree).sort());
  });
  it("no empty values", () => {
    for (const [name, t] of [["en", en], ["ar", ar]] as const) {
      const flat = keys(t as Tree);
      for (const k of flat) {
        const v = k.split(".").reduce<unknown>((o, s) => (o as Tree)[s], t);
        expect(v, `${name}:${k}`).not.toBe("");
      }
    }
  });
  it("Arabic strings are written in Arabic (Latin allowed only for brand names and language labels)", () => {
    const allowLatin = new Set(["common.english"]);
    for (const k of keys(ar as Tree)) {
      if (allowLatin.has(k)) continue;
      const v = k.split(".").reduce<unknown>((o, s) => (o as Tree)[s], ar) as string;
      expect(/[؀-ۿ]/.test(v), `ar:${k} should contain Arabic`).toBe(true);
    }
  });
});
