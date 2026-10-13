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
  /** Seed a complete story draft (the workshop's four choices). */
  draft?: boolean;
  /** Levels to mark completed (whole-level rows), e.g. to unlock later places. */
  completedLevels?: string[];
  dailyMinutes?: 15 | 30 | 45;
  usedSeconds?: number;
  onboarded?: boolean;
  /** Household time zone (default UTC) and allowed hours (default: all day, so tests pass at any hour). */
  timezone?: string;
  schedule?: { days: number[]; start: string; end: string }[];
  /** Seed one finished story (the reviewed fallback text, stand-in pictures): no model, no credits. */
  story?: boolean;
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
  let storyId: string | null = null;
  if (o.story) {
    const { fallbackStory } = await import("../safety/stories/write");
    const { choice } = await import("../safety/stories/choices");
    const f = fallbackStory(o.locale ?? "en");
    const [row] = await db
      .insert(s.story)
      .values({
        childId,
        householdId,
        locale: o.locale ?? "en",
        ageBand: "7-9",
        choices: { hero: choice("hero", "fox")!, place: choice("place", "forest")!, feeling: choice("feeling", "worried")!, adventure: choice("adventure", "lost_toy")! },
        content: { title: f.title, heroLook: f.heroLook, pages: f.pages, question: f.question },
        source: "fallback",
        pictures: Array.from({ length: 5 }, () => ({ state: "fallback" as const })),
        seed: 1,
        versions: { fixture: "e2e" },
      })
      .returning({ id: s.story.id });
    storyId = row.id;
  }
  if (o.draft) {
    const { choice } = await import("../safety/stories/choices");
    await db.insert(s.storyDraft).values({ childId, choices: { hero: choice("hero", "fox")!, place: choice("place", "forest")!, feeling: choice("feeling", "worried")!, adventure: choice("adventure", "lost_toy")! } });
  }
  if (o.completedLevels?.length) {
    await db.insert(s.progress).values(o.completedLevels.map((levelId) => ({ childId, packId: "base", levelId, scenarioId: "", status: "completed" as const })));
  }
  const { key } = await ops.createDeviceKey({ userId: res.user.id, householdId, childId, label: "e2e" });
  process.stdout.write(JSON.stringify({ email, key, childId, storyId, locale: o.locale ?? "en" }));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
