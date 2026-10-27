import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// The Tower, Home level 3 (D-078): a draft scenario that plays in development only. The child builds,
// Nori knocks the tower over, the child names Feelio's feeling, tries a stormy choice and rewinds,
// calms the storm with Cloud Breath, picks a kind choice, rebuilds, and finishes the level.
const APP = process.env.E2E_APP ?? "http://localhost:3000";
const SHOTS = ".playwright-mcp/shots/m10";
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

const beat = (page: Page) => page.getByTestId("tower");

async function build(page: Page, shot?: string) {
  for (let i = 0; i < 4; i++) {
    await page.getByTestId("tower-block").click();
    if (shot && i === 1) await page.screenshot({ path: shot });
  }
}

test("The Tower: storm, rewind, Cloud Breath, a kind choice, finish", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(LANDSCAPE);
  await asChild(page, fixture({ locale: "en", onboarded: true, completedLevels: ["home-1", "home-2"] }));
  await page.goto(`${APP}/place/home/level/home-3`);

  await expect(beat(page)).toHaveAttribute("data-beat", "build");
  await page.screenshot({ path: `${SHOTS}/en-1-build.png` });
  await build(page, `${SHOTS}/en-2-building.png`);
  await expect(beat(page)).toHaveAttribute("data-beat", "crash");
  await page.screenshot({ path: `${SHOTS}/en-3-crash.png` });
  await page.getByTestId("tower-next").click();

  await expect(beat(page)).toHaveAttribute("data-beat", "feel");
  await page.screenshot({ path: `${SHOTS}/en-4-feel.png` });
  await page.getByTestId("tower-face-sad").click();
  await expect(page.getByTestId("tower-line")).toContainText("angry too");
  await page.getByTestId("tower-next").click();

  // Stormy: only the stormy choices are there, plus the cloud.
  await expect(beat(page)).toHaveAttribute("data-beat", "choose");
  await expect(page.getByTestId("tower-choice-tell")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/en-5-choose-stormy.png` });
  await page.getByTestId("tower-choice-stomp").click();
  await expect(beat(page)).toHaveAttribute("data-beat", "stomp");
  await page.screenshot({ path: `${SHOTS}/en-6-stomp.png` });
  await page.getByTestId("tower-rewind").click();

  await page.getByTestId("tower-calm").click();
  await expect(beat(page)).toHaveAttribute("data-beat", "breathe");
  await page.screenshot({ path: `${SHOTS}/en-7-breathe.png` });
  await expect(beat(page)).toHaveAttribute("data-beat", "chooseCalm", { timeout: 25_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/en-8-choose-calm.png` });

  await page.getByTestId("tower-choice-tell").click();
  await expect(beat(page)).toHaveAttribute("data-beat", "tell");
  await page.screenshot({ path: `${SHOTS}/en-9-tell.png` });
  await page.getByTestId("tower-next").click();
  await build(page);

  await expect(beat(page)).toHaveAttribute("data-beat", "end");
  await expect(page.getByTestId("tower-journal")).toContainText("2 of 4");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/en-10-end.png` });
  await page.getByTestId("tower-finish").click();
  await expect(page.getByText(/finished level 3/i)).toBeVisible();
});

test("The Tower in Arabic, portrait: right to left, Arabic lines", async ({ page }) => {
  await page.setViewportSize(PORTRAIT);
  await asChild(page, fixture({ locale: "ar", onboarded: true, completedLevels: ["home-1", "home-2"] }));
  await page.goto(`${APP}/place/home/level/home-3`);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("tower-line")).toContainText("هذه غرفتي");
  await page.screenshot({ path: `${SHOTS}/ar-portrait-build.png` });
  await build(page);
  await page.getByTestId("tower-next").click();
  await expect(beat(page)).toHaveAttribute("data-beat", "feel");
  await page.screenshot({ path: `${SHOTS}/ar-portrait-feel.png` });
});
