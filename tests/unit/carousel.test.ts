import { describe, expect, it } from "vitest";
import { isTap, keyStep, offsetFrom, pickOnTap, swipeStep, wrap } from "@/child/ui/carousel";

describe("carousel maths", () => {
  it("wraps indexes", () => {
    expect(wrap(-1, 8)).toBe(7);
    expect(wrap(8, 8)).toBe(0);
    expect(wrap(3, 8)).toBe(3);
  });
  it("measures the shortest distance from the middle", () => {
    expect(offsetFrom(7, 0, 8)).toBe(-1);
    expect(offsetFrom(1, 0, 8)).toBe(1);
    expect(offsetFrom(4, 0, 8)).toBe(4);
  });
  it("turns swipes into steps in the reading direction", () => {
    expect(swipeStep(-80, false)).toBe(1);
    expect(swipeStep(80, false)).toBe(-1);
    expect(swipeStep(-80, true)).toBe(-1);
    expect(swipeStep(20, false)).toBe(0);
  });
  it("maps arrow keys, mirrored in Arabic", () => {
    expect(keyStep("ArrowRight", false)).toBe(1);
    expect(keyStep("ArrowRight", true)).toBe(-1);
    expect(keyStep("ArrowLeft", false)).toBe(-1);
    expect(keyStep("Enter", false)).toBe(0);
  });
  it("tells a tap from a drag", () => {
    expect(isTap(4, 3)).toBe(true);
    expect(isTap(30, 0)).toBe(false);
  });
  it("picks only the settled middle", () => {
    expect(pickOnTap(2, 2)).toBe("pick");
    expect(pickOnTap(3, 2)).toBe("centre");
  });
});
