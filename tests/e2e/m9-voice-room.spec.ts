import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// The voice room (D-076): what Feelio offers, the calm activities, and every way out, without a live
// call (a call spends ElevenLabs minutes; the live agent is checked by hand). Feelio's tool calls are
// handed to the screen through its development-only hook (window.__feelioTool), which runs the same
// validation as a real call. Touch, mouse and keyboard; English and Arabic; reduced motion; no overlaps.
const APP = "http://localhost:3000";
const SHOTS = ".playwright-mcp/shots/m9";
const SIZES = { phone: { width: 390, height: 844 }, tablet: { width: 1180, height: 820 }, desktop: { width: 1920, height: 920 } };

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

async function feelio(page: Page, name: string, args: unknown): Promise<boolean> {
  await page.waitForFunction(() => typeof (window as unknown as { __feelioTool?: unknown }).__feelioTool === "function");
  return page.evaluate(([n, a]) => (window as unknown as { __feelioTool: (n: string, a: unknown) => boolean }).__feelioTool(n as string, a), [name, args] as const);
}

type Box = { x: number; y: number; width: number; height: number };
const overlap = (a: Box, b: Box) => a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1;

let child: { key: string; locale: "en" | "ar" };
let childAr: { key: string; locale: "en" | "ar" };
test.beforeAll(() => {
  child = fixture({ locale: "en", onboarded: true, talk: true });
  childAr = fixture({ locale: "ar", onboarded: true, talk: true });
});

test("Feelio's offer waits for the child: not now, the same offer twice, only checked tools", async ({ page }) => {
  await asChild(page, child);
  await page.setViewportSize(SIZES.tablet);
  await page.goto(`${APP}/talk`);
  expect(await feelio(page, "offer_activity", { activity: "skydiving" })).toBe(false);
  expect(await feelio(page, "offer_activity", { activity: "breathing" })).toBe(true);
  await feelio(page, "offer_activity", { activity: "breathing" });
  await expect(page.getByTestId("offer")).toHaveCount(1);
  await expect(page.getByTestId("talk-room").locator('[data-pose="mascot_pointing"]')).toBeVisible();
  await expect(page.getByTestId("activity")).toHaveCount(0); // nothing starts until the child taps
  await page.getByTestId("offer-not-now").click();
  await expect(page.getByTestId("offer")).toHaveCount(0);
});

test("breathing by touch: start, pause holds still, keep going, next, stop back to the talk", async ({ browser }) => {
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: SIZES.phone });
  const page = await ctx.newPage();
  await asChild(page, child);
  await page.goto(`${APP}/talk`);
  await feelio(page, "offer_activity", { activity: "breathing" });
  await page.getByTestId("offer").tap();
  const act = page.getByTestId("activity");
  await expect(act).toHaveAttribute("data-activity", "breathing");
  await expect(page.getByTestId("activity-progress").locator("li")).toHaveCount(3);
  await expect(page.getByTestId("talk-toggle")).toHaveCount(0); // one thing at a time
  await expect(act).toHaveAttribute("data-kind", "in", { timeout: 8000 });

  await page.getByTestId("activity-pause").tap();
  await expect(act).toHaveAttribute("data-status", "paused");
  await page.waitForTimeout(5500); // longer than a breath: a paused run doesn't move
  await expect(act).toHaveAttribute("data-kind", "in");
  await page.getByTestId("activity-pause").tap();
  await expect(act).toHaveAttribute("data-status", "running");
  await expect(act).toHaveAttribute("data-kind", "out", { timeout: 6000 });

  await page.getByTestId("activity-next").tap();
  await expect(act).toHaveAttribute("data-kind", "in");
  await page.getByTestId("activity-stop").tap();
  await expect(page.getByTestId("activity")).toHaveCount(0);
  await expect(page.getByTestId("talk-toggle")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/after-stop-phone.png` });
  await ctx.close();
});

test("the noticing game by mouse: tap a picture for each thing found", async ({ page }) => {
  await asChild(page, child);
  await page.setViewportSize(SIZES.desktop);
  await page.goto(`${APP}/talk`);
  await feelio(page, "offer_activity", { activity: "grounding" });
  await page.getByTestId("offer").click();
  const act = page.getByTestId("activity");
  await expect(act).toHaveAttribute("data-kind", "find", { timeout: 8000 });
  await expect(page.getByTestId("find-tokens").locator("button")).toHaveCount(3);
  for (const i of [0, 1]) await page.getByTestId(`find-${i}`).click();
  await expect(page.getByTestId("find-0")).toHaveAttribute("data-found", "true");
  await page.screenshot({ path: `${SHOTS}/grounding-desktop.png` });
  await page.getByTestId("find-2").click();
  await expect(page.getByTestId("find-tokens").locator("button")).toHaveCount(2); // listening: two sounds
  await page.getByTestId("activity-next").click();
  await page.getByTestId("activity-next").click();
  await expect(act).toHaveAttribute("data-status", "done");
  await expect(page.getByTestId("activity-again")).toBeVisible();
  await expect(page.getByTestId("activity-talk")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/done-desktop.png` });
  await page.getByTestId("activity-again").click();
  await expect(act).toHaveAttribute("data-kind", "intro");
});

test("stretching by keyboard: focus moves in, space pauses, Escape stops, focus comes back", async ({ page }) => {
  await asChild(page, child);
  await page.setViewportSize(SIZES.tablet);
  await page.goto(`${APP}/talk`);
  await feelio(page, "offer_activity", { activity: "stretching" });
  await page.getByTestId("offer").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("activity-pause")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("activity")).toHaveAttribute("data-status", "paused");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("activity")).toHaveCount(0);
  await expect(page.getByTestId("talk-toggle")).toBeFocused();
});

test("help always wins, and nothing stale sneaks in during an activity", async ({ page }) => {
  await asChild(page, child);
  await page.setViewportSize(SIZES.tablet);
  await page.goto(`${APP}/talk`);
  await feelio(page, "offer_activity", { activity: "grounding" });
  // the router's crisis tool (never the model's) clears the offer and stays until closed
  await feelio(page, "show_safety_resources", { kinds: ["trusted_adult"] });
  await expect(page.getByTestId("help")).toBeVisible();
  await expect(page.getByTestId("help")).toBeFocused();
  await expect(page.getByTestId("offer")).toHaveCount(0);
  await feelio(page, "offer_activity", { activity: "breathing" });
  await expect(page.getByTestId("offer")).toHaveCount(0);
  await page.getByTestId("help-close").click();
  await expect(page.getByTestId("help")).toHaveCount(0);

  await feelio(page, "offer_activity", { activity: "breathing" });
  await page.getByTestId("offer").click();
  await feelio(page, "offer_activity", { activity: "stretching" });
  await feelio(page, "show_feeling_card", { feeling: "happy" });
  await page.getByTestId("activity-stop").click();
  await expect(page.getByTestId("offer")).toHaveCount(0);
  await expect(page.getByTestId("feeling")).toHaveCount(0);
});

test("one conversation (D-077): Feelio can stop the game when the child asks, and the talk is back", async ({ page }) => {
  await asChild(page, child);
  await page.setViewportSize(SIZES.tablet);
  await page.goto(`${APP}/talk`);
  // nothing to stop yet
  expect(await feelio(page, "stop_activity", {})).toBe(true);
  await feelio(page, "offer_activity", { activity: "grounding" });
  await page.getByTestId("offer").click();
  await expect(page.getByTestId("activity")).toBeVisible();
  await expect(page.getByTestId("activity")).not.toHaveAttribute("data-held");
  // arguments are a closed (empty) list
  expect(await feelio(page, "stop_activity", { now: true })).toBe(false);
  await expect(page.getByTestId("activity")).toBeVisible();
  expect(await feelio(page, "stop_activity", {})).toBe(true);
  await expect(page.getByTestId("activity")).toHaveCount(0);
  await expect(page.getByTestId("talk-toggle")).toBeVisible();
});

test("a story and a place are doors to their pages; a place the child hasn't reached never shows", async ({ page }) => {
  await asChild(page, child);
  await page.setViewportSize(SIZES.tablet);
  await page.goto(`${APP}/talk`);
  await feelio(page, "offer_activity", { activity: "story" });
  await expect(page.getByTestId("offer")).toHaveAttribute("href", "/stories/make");
  await feelio(page, "suggest_place", { place: "market" });
  await expect(page.getByTestId("offer")).toHaveAttribute("href", "/stories/make");
  await feelio(page, "suggest_place", { place: "home" });
  await expect(page.getByTestId("offer")).toHaveAttribute("href", "/place/home");
});

test("reduced motion: the cloud changes size in one step, nothing loops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await asChild(page, child);
  await page.setViewportSize(SIZES.tablet);
  await page.goto(`${APP}/talk`);
  await feelio(page, "offer_activity", { activity: "breathing" });
  await page.getByTestId("offer").click();
  const act = page.getByTestId("activity");
  await expect(act).toHaveAttribute("data-calm", "true");
  await expect(act).toHaveAttribute("data-kind", "in", { timeout: 8000 });
  const animations = await page.evaluate(() => document.getAnimations().filter((a) => (a as CSSAnimation).animationName && a.playState === "running").length);
  expect(animations).toBe(0);
});

for (const [locale, who] of [["en", () => child], ["ar", () => childAr]] as const) {
  test(`layout (${locale}): Feelio, the feeling, the offer, the words and the microphone never overlap; controls clear the dock`, async ({ page }) => {
    await asChild(page, who());
    for (const [name, size] of Object.entries(SIZES)) {
      await page.setViewportSize(size);
      await page.goto(`${APP}/talk`);
      await feelio(page, "show_feeling_card", { feeling: "sad" });
      await feelio(page, "offer_activity", { activity: "breathing" });
      await expect(page.getByTestId("offer")).toBeVisible();
      await expect(page.getByTestId("feeling")).toBeVisible();
      await page.waitForTimeout(600); // let the entrances settle
      const dock = (await page.locator("nav[data-dock]").boundingBox())!;
      const boxes = {
        mascot: (await page.getByTestId("talk-room").locator("[data-pose]").first().boundingBox())!,
        offer: (await page.getByTestId("offer").boundingBox())!,
        feeling: (await page.getByTestId("feeling").boundingBox())!,
        mic: (await page.getByTestId("talk-toggle").boundingBox())!,
      };
      const keys = Object.keys(boxes) as (keyof typeof boxes)[];
      for (const a of keys) for (const b of keys) if (a < b) expect(overlap(boxes[a], boxes[b]), `${name}: ${a} overlaps ${b}`).toBe(false);
      expect(boxes.mic.y + boxes.mic.height, `${name}: microphone above the dock`).toBeLessThanOrEqual(dock.y);
      expect(boxes.offer.height).toBeGreaterThanOrEqual(72);
      // Feelio points to its right, so the offer is on its right in both languages (pictures never mirror)
      expect(boxes.offer.x + boxes.offer.width / 2, `${name}: offer on Feelio's right`).toBeGreaterThan(boxes.mascot.x + boxes.mascot.width / 2);
      await page.screenshot({ path: `${SHOTS}/talk-${locale}-${name}.png` });

      await page.getByTestId("offer").click();
      await expect(page.getByTestId("activity")).toBeVisible();
      await page.waitForTimeout(500);
      for (const id of ["activity-stop", "activity-pause", "activity-next"]) {
        const b = (await page.getByTestId(id).boundingBox())!;
        expect(b.y + b.height, `${name}: ${id} above the dock`).toBeLessThanOrEqual(dock.y);
        expect(b.height, `${name}: ${id} big enough`).toBeGreaterThanOrEqual(72);
      }
      await page.screenshot({ path: `${SHOTS}/breathing-${locale}-${name}.png` });
    }
  });
}
