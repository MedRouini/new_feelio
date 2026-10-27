import { describe, expect, it } from "vitest";
import { canPress, pressAttrs } from "@/child/ui/press";

describe("press states", () => {
  it("maps states to attributes", () => {
    expect(pressAttrs({})).toEqual({ "aria-busy": undefined, "aria-disabled": undefined, "data-loading": undefined, "data-disabled": undefined, "data-selected": undefined, "data-resting": undefined });
    expect(pressAttrs({ loading: true })["aria-busy"]).toBe(true);
    expect(pressAttrs({ disabled: true })["aria-disabled"]).toBe(true);
    expect(pressAttrs({ selected: true })["data-selected"]).toBe(true);
    expect(pressAttrs({ resting: true })["data-resting"]).toBe(true);
  });
  it("blocks presses while loading or disabled, not while resting", () => {
    expect(canPress({})).toBe(true);
    expect(canPress({ loading: true })).toBe(false);
    expect(canPress({ disabled: true })).toBe(false);
    expect(canPress({ resting: true })).toBe(true);
  });
});
