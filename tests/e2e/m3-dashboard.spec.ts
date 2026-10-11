import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// Milestone 3: the parent dashboard (child page, allowed hours, time zone, report, guide, safety-lead
// access) and the child app's "resting" screen when it's outside the allowed hours (D-065, D-066).
const APP = "http://localhost:3000";
const DASH = "http://dashboard.localhost:3000";
const SHOTS = ".playwright-mcp/shots/m3";

type Fixture = { email: string; key: string; childId: string; locale: "en" | "ar" };

function fixture(opts: Record<string, unknown>): Fixture {
  const out = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", "--conditions=react-server", "scripts/e2e-fixture.ts"],
    { env: { ...process.env, E2E_FIXTURES: "1", E2E_FIXTURE_OPTS: JSON.stringify(opts) }, encoding: "utf8", shell: process.platform === "win32" },
  );
  return JSON.parse(out.trim().split("\n").pop()!);
}

async function signIn(page: Page, email: string) {
  await page.goto(DASH + "/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Your children" })).toBeVisible({ timeout: 30_000 });
}

test("child page: time, week, progress, safety notes, report; settings: allowed hours", async ({ page }) => {
  const f = fixture({ locale: "en", onboarded: true, timezone: "Asia/Dubai" });
  await signIn(page, f.email);
  await page.goto(`${DASH}/children/${f.childId}`);
  await expect(page.getByTestId("today-time")).toContainText("of 45 min");
  await expect(page.getByTestId("child-status")).toHaveText("Can play now");
  await expect(page.getByTestId("week").locator("li")).toHaveCount(7);
  await expect(page.getByTestId("progress").locator("li")).toHaveCount(5);
  await expect(page.getByTestId("progress").locator('[data-place="home"]')).toContainText("0 of 5 levels finished");
  await page.screenshot({ path: `${SHOTS}/child-page.png`, fullPage: true });

  // Safety tab: notes and "Something felt wrong?"
  await page.getByTestId("tab-safety").click();
  await expect(page.getByText("Nothing to report. Feelio hasn't needed to step in.")).toBeVisible();
  const form = page.getByTestId("report-form");
  await form.getByRole("combobox").selectOption("acted_like_a_person");
  await form.getByRole("textbox").fill("It said it was a real person.");
  await form.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByText("Thank you. Our safety team will look at this.")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/child-safety.png`, fullPage: true });

  // Allowed hours: the times are in the family's time zone, shown on the page.
  await page.getByTestId("tab-controls").click();
  await expect(page).toHaveURL(/\/children\/.+\/settings$/);
  await expect(page.getByTestId("allowed-hours")).toContainText("Asia/Dubai");
  await page.screenshot({ path: `${SHOTS}/settings.png`, fullPage: true });
  // no days selected: refused with a clear message, nothing saved
  for (const box of await page.getByTestId("allowed-hours").getByRole("checkbox").all()) await box.uncheck({ force: true });
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Choose at least one day, and an end time after the start time.")).toBeVisible();
});

test("outside the allowed hours the child sees Feelio resting, and the parent sees why", async ({ page }) => {
  // A one-hour window at a time that is never "now": the hour that starts 12 hours from the current UTC hour.
  const h = (new Date().getUTCHours() + 12) % 24;
  const hh = String(h).padStart(2, "0");
  const end = h === 23 ? "24:00" : `${String(h + 1).padStart(2, "0")}:00`;
  const f = fixture({ locale: "en", onboarded: true, timezone: "UTC", schedule: [{ days: [0, 1, 2, 3, 4, 5, 6], start: `${hh}:00`, end }] });
  await page.context().addCookies([
    { name: "feelio_device", value: f.key, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "feelio_locale", value: "en", domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  await page.goto(APP);
  await expect(page.getByTestId("time-up")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("time-up").locator("[data-reason]")).toHaveAttribute("data-reason", "outside_hours");
  await expect(page.getByText(/Feelio is resting now/).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/child-resting.png` });
  // the level API refuses too (server-side, not only the screen)
  const status = await page.evaluate(async () => (await fetch("/api/child/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "start", levelId: "home-1", artifactId: "dev-test" }) })).status);
  expect(status).toBe(403);

  await signIn(page, f.email);
  await page.goto(`${DASH}/children/${f.childId}`);
  await expect(page.getByTestId("pause-status")).toContainText("Feelio is resting now");
});

test("guide, time zone, and the safety review is not found for a parent who isn't the safety lead", async ({ page }) => {
  const f = fixture({ locale: "en", onboarded: true });
  await signIn(page, f.email);
  await page.goto(DASH + "/guide");
  await expect(page.getByTestId("guide")).toContainText("One important exception");
  await page.screenshot({ path: `${SHOTS}/guide.png`, fullPage: true });

  await page.goto(DASH + "/account");
  await page.getByTestId("timezone").selectOption("Asia/Dubai");
  await page.getByRole("button", { name: "Save time zone" }).click();
  await expect(page.getByText("Time zone saved.")).toBeVisible();
  await expect(page.getByTestId("timezone")).toHaveValue("Asia/Dubai");

  // A parent who isn't the safety lead: no link, and the page answers "not found" (signing in just
  // now counts as the fresh password check the page requires).
  await expect(page.getByRole("link", { name: "Safety review" })).toHaveCount(0);
  const res = await page.goto(DASH + "/safety");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Safety review" })).toHaveCount(0);
});
