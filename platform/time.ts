import { DateTime, IANAZone } from "luxon";

// All clock and calendar logic for the family's own time zone (D-065). Luxon handles IANA zones,
// daylight-saving changes and calendar maths; nothing here hand-rolls offsets. Pure functions, so
// they are unit-tested with fixed instants.

export type ScheduleWindow = {
  /** Days of the week the window applies to: 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Local wall-clock times, "HH:MM", 24-hour. `end` is exclusive and later than `start`; "24:00" = midnight. */
  start: string;
  end: string;
};

export const DEFAULT_ZONE = "UTC";

export function isValidZone(zone: string | null | undefined): zone is string {
  return typeof zone === "string" && zone.length < 64 && IANAZone.isValidZone(zone);
}

/** A zone that is safe to use: the given one if valid, else UTC. */
export function safeZone(zone: string | null | undefined): string {
  return isValidZone(zone) ? zone : DEFAULT_ZONE;
}

const local = (now: Date, zone: string) => DateTime.fromJSDate(now, { zone: safeZone(zone) });

/** The family's calendar day ("YYYY-MM-DD") at this instant. */
export function localDay(now: Date, zone: string): string {
  return local(now, zone).toISODate()!;
}

/** The last `n` local days, oldest first, ending today. */
export function lastLocalDays(now: Date, zone: string, n: number): string[] {
  const today = local(now, zone).startOf("day");
  return Array.from({ length: n }, (_, i) => today.minus({ days: n - 1 - i }).toISODate()!);
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function isValidTime(s: string): boolean {
  return HHMM.test(s);
}
/** An end time may also be "24:00" (until midnight). */
const isValidEnd = (s: string) => s === "24:00" || HHMM.test(s);
const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** A window is usable when its times are valid, it ends after it starts, and it has at least one day. */
export function isValidWindow(w: ScheduleWindow): boolean {
  return (
    isValidTime(w.start) &&
    isValidEnd(w.end) &&
    minutesOf(w.end) > minutesOf(w.start) &&
    w.days.length > 0 &&
    w.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  );
}

export type ScheduleStatus = {
  allowed: boolean;
  /** When Feelio is next available (only when not allowed now); null if no window in the next week. */
  next: { at: Date; sameDay: boolean } | null;
};

/**
 * Is this instant inside one of the family's allowed windows, in their time zone? An empty schedule
 * means "any time" is NOT assumed: no window, no play (the parent chose no days).
 */
export function scheduleStatus(now: Date, zone: string, windows: ScheduleWindow[]): ScheduleStatus {
  const t = local(now, zone);
  const valid = windows.filter(isValidWindow);
  const weekday = t.weekday % 7; // Luxon: 1 = Monday … 7 = Sunday → 0 = Sunday … 6 = Saturday
  const minute = t.hour * 60 + t.minute;
  const allowed = valid.some((w) => w.days.includes(weekday) && minute >= minutesOf(w.start) && minute < minutesOf(w.end));
  if (allowed) return { allowed, next: null };

  let best: DateTime | null = null;
  for (let ahead = 0; ahead < 8; ahead++) {
    const day = t.startOf("day").plus({ days: ahead });
    const wd = day.weekday % 7;
    for (const w of valid) {
      if (!w.days.includes(wd)) continue;
      const start = day.set({ hour: Number(w.start.slice(0, 2)), minute: Number(w.start.slice(3, 5)) });
      if (start > t && (!best || start < best)) best = start;
    }
    if (best) break;
  }
  return { allowed, next: best ? { at: best.toJSDate(), sameDay: best.hasSame(t, "day") } : null };
}

/** A local time for people: "4:00 PM" or "٤:٠٠ م" (Arabic-Indic digits, as everywhere in Feelio). */
export function formatLocalTime(at: Date, zone: string, locale: "en" | "ar"): string {
  return DateTime.fromJSDate(at, { zone: safeZone(zone) }).setLocale(locale === "ar" ? "ar-EG" : "en").toLocaleString(DateTime.TIME_SIMPLE);
}

/** All IANA zones the runtime knows, for the parent's picker (validated again on save). */
export function supportedZones(): string[] {
  const all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [DEFAULT_ZONE];
  return all.includes(DEFAULT_ZONE) ? all : [DEFAULT_ZONE, ...all];
}
