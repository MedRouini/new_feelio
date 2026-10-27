import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VOICE_LINES } from "@/safety/voice-lines/lines";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { BREATH_MS, BREATHS, CHOICES, lineMs, KIND, START, STORMY, TOWER_HEIGHT, choicesOn, lineOf, step, type TowerEvent, type TowerState } from "@/world/artifacts/scenarios/tower";

const run = (events: TowerEvent[], from: TowerState = START) => events.reduce(step, from);
const blocks = (n: number): TowerEvent[] => Array.from({ length: n }, () => ({ type: "block" }));
const breaths: TowerEvent[] = Array.from({ length: BREATHS }, () => ({ type: "breath" }));
const toChoose: TowerEvent[] = [...blocks(TOWER_HEIGHT), { type: "next" }, { type: "face", face: "sad" }, { type: "next" }];

describe("The Tower (home-3)", () => {
  it("builds, crashes, and asks how Feelio feels", () => {
    const built = run(blocks(TOWER_HEIGHT - 1));
    expect(built).toMatchObject({ beat: "build", height: TOWER_HEIGHT - 1 });
    expect(lineOf(built)).toBe("buildLast");
    const crashed = step(built, { type: "block" });
    expect(crashed.beat).toBe("crash");
    expect(step(crashed, { type: "next" })).toMatchObject({ beat: "feel", height: 0 });
  });

  it("answers every feeling the child picks; none is wrong", () => {
    const feel = run([...blocks(TOWER_HEIGHT), { type: "next" }]);
    expect(lineOf(step(feel, { type: "face", face: "angry" }))).toBe("feelAngry");
    expect(lineOf(step(feel, { type: "face", face: "sad" }))).toBe("feelMixed");
    expect(lineOf(step(feel, { type: "face", face: "worried" }))).toBe("feelMixed");
    expect(lineOf(step(feel, { type: "face", face: "happy" }))).toBe("feelHappy");
  });

  it("a big storm leaves only stormy choices; kind ones can't be picked yet", () => {
    const s = run(toChoose);
    expect(s.beat).toBe("choose");
    expect(choicesOn(s)).toEqual(STORMY);
    for (const c of KIND) expect(step(s, { type: "pick", choice: c })).toBe(s);
  });

  it("a stormy choice shows what happens, and rewind always goes back", () => {
    for (const c of STORMY) {
      const out = run([...toChoose, { type: "pick", choice: c }]);
      expect(out.beat).toBe(c);
      expect(out.found).toEqual([c]);
      expect(step(out, { type: "rewind" }).beat).toBe("choose");
    }
  });

  it("Cloud Breath calms the storm and opens all four choices", () => {
    const calm = run([...toChoose, { type: "calm" }, ...breaths]);
    expect(calm.beat).toBe("chooseCalm");
    expect(choicesOn(calm)).toEqual(CHOICES);
    expect(lineOf(run([...toChoose, { type: "calm" }]))).toBe("breatheIn");
    expect(lineOf(run([...toChoose, { type: "calm" }, { type: "breath" }]))).toBe("breatheOut");
  });

  it("a kind choice leads to building again together, then the end", () => {
    const end = run([...toChoose, { type: "calm" }, ...breaths, { type: "pick", choice: "tell" }, { type: "next" }, ...blocks(TOWER_HEIGHT)]);
    expect(end.beat).toBe("end");
    expect(end.found).toEqual(["tell"]);
  });

  it("try another way keeps the journal and counts each ending once", () => {
    const end = run([...toChoose, { type: "pick", choice: "stomp" }, { type: "rewind" }, { type: "pick", choice: "stomp" }, { type: "rewind" }, { type: "calm" }, ...breaths, { type: "pick", choice: "together" }, { type: "next" }, ...blocks(TOWER_HEIGHT)]);
    expect(end.found).toEqual(["stomp", "together"]);
    const again = step(end, { type: "again" });
    expect(again).toMatchObject({ beat: "choose", found: ["stomp", "together"] });
  });

  it("every line exists in English and Arabic", () => {
    const keys = ["build", "buildMore", "buildLast", "crash", "feel", "feelAngry", "feelMixed", "feelHappy", "choose", "hint", "stomp", "shout", "rewind", "breathe", "breatheIn", "breatheOut", "chooseCalm", "tell", "together", "rebuild", "rebuildMore", "end"];
    for (const msgs of [en, ar]) {
      const t = (msgs.child as unknown as { scenarios: { tower: Record<string, string> } }).scenarios.tower;
      for (const k of keys) expect(t[k], k).toBeTruthy();
    }
  });
});

describe("The Tower's recorded lines", () => {
  // CBR MP3 (the voice-line script's output): length from the size and the first frame's bit rate
  const seconds = (file: string) => {
    const b = readFileSync(file);
    let i = b.subarray(0, 3).toString() === "ID3" ? 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]) : 0;
    while (i < b.length && !(b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0)) i++;
    const kbps = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320][(b[i + 2] >> 4) & 15];
    return ((b.length - i) * 8) / (kbps * 1000);
  };
  const tower = (en.child as unknown as { scenarios: { tower: Record<string, string> } }).scenarios.tower;

  it("every line that moves on by itself stays longer than its recording", () => {
    for (const k of ["crash", "feelAngry", "feelMixed", "feelHappy", "tell", "together"]) {
      const file = `public/audio/en/tower_${k}.mp3`;
      if (existsSync(file)) expect(seconds(file) * 1000 + 500, k).toBeLessThanOrEqual(lineMs(tower[k]));
    }
    for (const k of ["breatheIn", "breatheOut"]) {
      const file = `public/audio/en/tower_${k}.mp3`;
      if (existsSync(file)) expect(seconds(file) * 1000, k).toBeLessThanOrEqual(BREATH_MS);
    }
  });

  it("every Tower line is in the voice-line list", () => {
    for (const k of Object.keys(tower).filter((k) => typeof tower[k] === "string" && !["rewind", "breathe", "trick", "journal", "again", "finish", "next", "nori", "tower", "blocks", "journalTitle"].includes(k)))
      expect(VOICE_LINES[`tower_${k}`], k).toBe(`child.scenarios.tower.${k}`);
  });
});
