import { describe, expect, it } from "vitest";
import { formatLocalTime, isValidWindow, isValidZone, lastLocalDays, localDay, safeZone, scheduleStatus } from "@/platform/time";

// Time zones and allowed hours (D-065). Fixed instants, so the results don't depend on the machine.
const at = (iso: string) => new Date(iso);
const SCHOOL_DAYS = { days: [1, 2, 3, 4, 5], start: "16:00", end: "19:00" };

describe("time zones", () => {
  it("validates IANA zones and falls back to UTC", () => {
    expect(isValidZone("Asia/Dubai")).toBe(true);
    expect(isValidZone("Not/AZone")).toBe(false);
    expect(safeZone("bad")).toBe("UTC");
  });

  it("the family's day, not UTC's: 23:30 UTC is already tomorrow in Dubai", () => {
    expect(localDay(at("2026-10-11T23:30:00Z"), "UTC")).toBe("2026-10-11");
    expect(localDay(at("2026-10-11T23:30:00Z"), "Asia/Dubai")).toBe("2026-10-12");
    expect(localDay(at("2026-10-11T02:00:00Z"), "America/Los_Angeles")).toBe("2026-10-10");
  });

  it("lists the last 7 local days, oldest first", () => {
    expect(lastLocalDays(at("2026-10-11T12:00:00Z"), "Europe/London", 3)).toEqual(["2026-10-09", "2026-10-10", "2026-10-11"]);
  });

  it("handles daylight-saving changes (London moves to GMT on 2026-10-25)", () => {
    // 15:30 UTC is 16:30 local before the change (BST) and 15:30 local after it (GMT).
    expect(scheduleStatus(at("2026-10-23T15:30:00Z"), "Europe/London", [{ days: [5], start: "16:00", end: "19:00" }]).allowed).toBe(true);
    expect(scheduleStatus(at("2026-10-30T15:30:00Z"), "Europe/London", [{ days: [5], start: "16:00", end: "19:00" }]).allowed).toBe(false);
  });
});

describe("allowed hours", () => {
  it("allows inside a window on the right day, in the family's zone", () => {
    // Monday 2026-10-12, 16:30 in Dubai = 12:30 UTC
    expect(scheduleStatus(at("2026-10-12T12:30:00Z"), "Asia/Dubai", [SCHOOL_DAYS]).allowed).toBe(true);
    // 11:30 UTC is 12:30 in London: too early
    expect(scheduleStatus(at("2026-10-12T11:30:00Z"), "Europe/London", [SCHOOL_DAYS]).allowed).toBe(false);
  });

  it("end is exclusive, and the next start is found (later today, or another day)", () => {
    const end = scheduleStatus(at("2026-10-12T15:00:00Z"), "Asia/Dubai", [SCHOOL_DAYS]); // 19:00 Dubai
    expect(end.allowed).toBe(false);
    expect(end.next?.sameDay).toBe(false);
    expect(end.next?.at.toISOString()).toBe("2026-10-13T12:00:00.000Z"); // Tuesday 16:00 Dubai
    const morning = scheduleStatus(at("2026-10-12T05:00:00Z"), "Asia/Dubai", [SCHOOL_DAYS]); // 09:00 Dubai
    expect(morning.next?.sameDay).toBe(true);
    const saturday = scheduleStatus(at("2026-10-17T12:30:00Z"), "Asia/Dubai", [SCHOOL_DAYS]);
    expect(saturday.next?.at.toISOString()).toBe("2026-10-19T12:00:00.000Z"); // Monday 16:00
  });

  it("no valid window means no play, and invalid windows are ignored", () => {
    expect(scheduleStatus(at("2026-10-12T12:30:00Z"), "UTC", [])).toEqual({ allowed: false, next: null });
    expect(isValidWindow({ days: [1], start: "19:00", end: "16:00" })).toBe(false);
    expect(isValidWindow({ days: [], start: "08:00", end: "09:00" })).toBe(false);
    expect(isValidWindow({ days: [7], start: "08:00", end: "09:00" })).toBe(false);
    expect(isValidWindow({ days: [0], start: "8:00", end: "09:00" })).toBe(false);
  });

  it("formats times for people in each language", () => {
    // newer ICU puts a narrow no-break space before "PM"; compare spacing-insensitively
    expect(formatLocalTime(at("2026-10-12T12:00:00Z"), "Asia/Dubai", "en").replace(/\s/gu, " ")).toBe("4:00 PM");
    expect(formatLocalTime(at("2026-10-12T12:00:00Z"), "Asia/Dubai", "ar")).toMatch(/٤/);
  });
});
