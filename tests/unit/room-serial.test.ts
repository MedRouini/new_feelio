import { describe, expect, it } from "vitest";
import { serial } from "@/app/child/room/serial";

describe("review fix: room saves run one at a time, in order", () => {
  it("starts each save only after the previous one finished", async () => {
    const log: string[] = [];
    const run = serial();
    const job = (name: string, ms: number) => () => new Promise<string>((r) => { log.push(`start ${name}`); setTimeout(() => { log.push(`end ${name}`); r(name); }, ms); });
    const results = await Promise.all([run(job("hat", 30)), run(job("colour", 1)), run(job("glasses", 5))]);
    expect(results).toEqual(["hat", "colour", "glasses"]);
    expect(log).toEqual(["start hat", "end hat", "start colour", "end colour", "start glasses", "end glasses"]);
  });
  it("keeps going after a failed save", async () => {
    const run = serial();
    const a = run(() => Promise.reject(new Error("offline")));
    const b = run(() => Promise.resolve("ok"));
    await expect(a).rejects.toThrow("offline");
    await expect(b).resolves.toBe("ok");
  });
});
