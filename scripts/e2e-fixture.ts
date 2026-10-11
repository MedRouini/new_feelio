// TEST-ONLY: creates a synthetic parent + child + device key for Playwright, prints JSON.
// Refuses to run unless E2E_FIXTURES=1. Not part of the app (never served). Accounts use
// test+e2e-…@example.test and are deleted by tests/e2e/cleanup.ts (global teardown).
// Run with the react-server condition so `server-only` imports resolve:
//   E2E_FIXTURES=1 npx tsx --conditions=react-server scripts/e2e-fixture.ts '{"locale":"ar"}'
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
}

type Opts = {
  locale?: "en" | "ar";
  nickname?: string | null;
  talk?: boolean;
  stories?: boolean;
  dailyMinutes?: 15 | 30 | 45;
  usedSeconds?: number;
  onboarded?: boolean;
  /** Household time zone (default UTC) and allowed hours (default: all day, so tests pass at any hour). */
  timezone?: string;
  schedule?: { days: number[]; start: string; end: string }[];
};

async function main() {
  if (process.env.E2E_FIXTURES !== "1") throw new Error("Refusing: set E2E_FIXTURES=1 (test-only script)");
  // Options come from E2E_FIXTURE_OPTS (argv JSON gets mangled by the Windows shell) or argv[2].
  const o: Opts = JSON.parse(process.env.E2E_FIXTURE_OPTS ?? process.argv[2] ?? "{}");
  const { auth } = await import("../auth/server");
  const ops = await import("../parent/operations");
  const { db } = await import("../platform/db/client");
  const s = await import("../platform/db/schema");
  const { eq } = await import("drizzle-orm");

  const email = `test+e2e-fx-${crypto.randomUUID()}@example.test`;
  const res = await auth.api.signUpEmail({ body: { name: "E2E Fixture", email, password: "correct-horse-battery" } });
  const householdId = await ops.recordConsentAndCreateHousehold({ userId: res.user.id, locale: o.locale ?? "en", timezone: o.timezone ?? "UTC" });
  const childId = await ops.createChild({
    userId: res.user.id,
    householdId,
    nickname: o.nickname ?? null,
    ageBand: "7-9",
    locale: o.locale ?? "en",
  });
  await ops.updateSettings({
    userId: res.user.id,
    householdId,
    childId,
    s: { talk: o.talk ?? false, stories: o.stories ?? true, dailyMinutes: o.dailyMinutes ?? 45, sound: false },
  });
  await db
    .update(s.childSettings)
    .set({ schedule: o.schedule ?? [{ days: [0, 1, 2, 3, 4, 5, 6], start: "00:00", end: "24:00" }] })
    .where(eq(s.childSettings.childId, childId));
  if (o.onboarded) {
    await db
      .update(s.childProfile)
      .set({ avatar: { v: 1, shape: "bun", colour: "amber", companion: "star" }, nicknameKey: "pip", onboarding: { step: 6, completedAt: new Date().toISOString() } })
      .where(eq(s.childProfile.id, childId));
  }
  if (o.usedSeconds) {
    await db.insert(s.usageLedger).values({ childId, householdId, day: new Date().toISOString().slice(0, 10), feature: "app", seconds: o.usedSeconds });
  }
  const { key } = await ops.createDeviceKey({ userId: res.user.id, householdId, childId, label: "e2e" });
  process.stdout.write(JSON.stringify({ email, key, childId, locale: o.locale ?? "en" }));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
