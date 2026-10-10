import { describe, expect, it } from "vitest";
import { getMarket } from "@/platform/markets";

describe("market config (SPEC §8)", () => {
  it("baseline loads and is the strict default", () => {
    const m = getMarket("baseline");
    expect(m.minParentAge).toBeGreaterThanOrEqual(18);
    expect(m.consent.scopes.length).toBeGreaterThan(0);
    expect(m.consent.reviewStatus).toMatch(/legal_review/);
  });
  it("unknown markets fail loudly", () => {
    expect(() => getMarket("nowhere")).toThrow(/Unknown market/);
  });
});
