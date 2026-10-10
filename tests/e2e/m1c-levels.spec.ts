import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// Level flow (D-056): world map → Home's own map → level → (developer test artifact, dev only) →
// celebration → next level unlocked → back on the place map. Real artifacts don't exist yet; in dev the
// clearly labelled test stand-in lets the flow be exercised end to end. Production never has it.
const APP = "http://localhost:3000";
const SHOTS = ".playwright-mcp/shots/m1c";
const LANDSCAPE = { width: 1180, height: 820 };
const PORTRAIT = { width: 390, height: 844 };

function fixture(opts: Record<string, unknown>): { key: string; locale: "en" | "ar" } {
  const out = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", "--conditions=react-server", "scripts/e2e-fixture.ts"],
    { env: { ...process.env, E2E_FIXTURES: "1", E2E_FIXTURE_OPTS: JSON.stringify(opts) }, encoding: "utf8", shell: process.platform === "win32" },
  );
  return JSON.parse(out.trim().split("\n").pop()!);
}

async function asChild(page: Page, f: { key: string; locale: string }) {
  await page.context().addCookies([
    { name: "feelio_device", value: f.key, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "feelio_locale", value: f.locale, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
}

test("Home → place map → level 1 → finished → level 2 opens", async ({ page }) => {
  await page.setViewportSize(LANDSCAPE);
  await asChild(page, fixture({ locale: "en", onboarded: true }));
  await page.goto(APP);

  // Tapping Home opens the loading scene from the tap, then Home's own map.
  await page.locator('[data-place="home"]').click();
  await expect(page.getByTestId("loading").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/en-landscape-loading-place.png` });
  await expect(page).toHaveURL(/\/place\/home$/, { timeout: 30_000 }); // dev compiles new routes on first visit
  await expect(page.getByTestId("loading")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByTestId("place-sign")).toContainText("Home");
  await expect(page.getByTestId("level-home-1")).toHaveAttribute("data-state", "available");
  for (const n of [2, 3, 4, 5]) await expect(page.getByTestId(`level-home-${n}`)).toHaveAttribute("data-state", "locked");
  await expect(page.getByTestId("place-ring")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/en-landscape-place.png` });

  // A locked level: a gentle "not yet", never an error.
  await page.getByTestId("level-home-3").click();
  await expect(page.getByText("Not yet! Let's finish level 2 first.")).toBeVisible();

  // Level 1: the level loading scene, then the (dev-only) test artifact.
  await page.getByTestId("level-home-1").click();
  await expect(page).toHaveURL(/\/place\/home\/level\/home-1$/, { timeout: 30_000 });
  await expect(page.getByTestId("dev-test-artifact")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("loading")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/en-landscape-level-devtest.png` });

  // Leaving keeps it "in progress".
  await page.getByTestId("dev-exit").click();
  await expect(page).toHaveURL(/\/place\/home$/);
  await expect(page.getByTestId("level-home-1")).toHaveAttribute("data-state", "in_progress");

  // Finish it: celebration with progress and what opened.
  await page.getByTestId("level-home-1").click();
  await page.getByTestId("dev-complete").click();
  await expect(page.getByTestId("celebration")).toBeVisible();
  await expect(page.getByText("You finished level 1!")).toBeVisible();
  await expect(page.getByText("Level 2 is open now!")).toBeVisible();
  await expect(page.getByTestId("progress-row").locator("li")).toHaveCount(5);
  await expect(page.getByTestId("progress-row").locator("li").first()).toHaveAttribute("data-state", "completed");
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/en-landscape-celebration.png` });

  // Keep going: back on Home's map, level 1 done, level 2 is next.
  await page.getByTestId("celebration-next").click();
  await expect(page).toHaveURL(/\/place\/home\?from=home-1$/);
  await expect(page.getByTestId("level-home-1")).toHaveAttribute("data-state", "completed");
  await expect(page.getByTestId("level-home-2")).toHaveAttribute("data-state", "available");
});

test("portrait phone and Arabic: place map, level and celebration", async ({ page }) => {
  await page.setViewportSize(PORTRAIT);
  await asChild(page, fixture({ locale: "ar", onboarded: true }));
  await page.goto(`${APP}/place/home`);
  await expect(page.getByTestId("loading")).toHaveCount(0);
  await expect(page.getByTestId("place-sign")).toContainText("البيت");
  await expect(page.locator("[data-orientation]")).toHaveAttribute("data-orientation", "vertical");
  await page.screenshot({ path: `${SHOTS}/ar-portrait-place.png` });
  await page.getByTestId("level-home-1").click();
  await page.getByTestId("dev-complete").click();
  await expect(page.getByText("أنهيت المستوى ١!")).toBeVisible();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/ar-portrait-celebration.png` });
});

test("server refuses: locked level by address and by API, locked place by address", async ({ page }) => {
  await asChild(page, fixture({ locale: "en", onboarded: true }));
  // A typed address to a locked level or place goes back, never shows it.
  await page.goto(`${APP}/place/home/level/home-3`);
  await expect(page).toHaveURL(/\/place\/home$/);
  await page.goto(`${APP}/place/park`);
  await expect(page).toHaveURL(/localhost:3000\/$/);
  // The API refuses to complete a locked level.
  const status = await page.evaluate(async () => {
    const r = await fetch("/api/child/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "complete", levelId: "home-3", artifactId: "dev-test" }) });
    return r.status;
  });
  expect(status).toBe(403);
});
