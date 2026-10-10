import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// Milestone 1b: onboarding ("Arriving in Feelio's world") and the interactive map, in English and
// Arabic, tablet landscape and phone portrait. Undelivered art shows as TODO(PLACEHOLDER) boxes.
const APP = "http://localhost:3000";
const SHOTS = ".playwright-mcp/shots/m1b";
const LANDSCAPE = { width: 1180, height: 820 };
const PORTRAIT = { width: 390, height: 844 };

type Fixture = { key: string; locale: "en" | "ar" };

function fixture(opts: Record<string, unknown>): Fixture {
  const out = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", "--conditions=react-server", "scripts/e2e-fixture.ts"],
    { env: { ...process.env, E2E_FIXTURES: "1", E2E_FIXTURE_OPTS: JSON.stringify(opts) }, encoding: "utf8", shell: process.platform === "win32" },
  );
  return JSON.parse(out.trim().split("\n").pop()!);
}

async function asChild(page: Page, f: Fixture) {
  await page.context().addCookies([
    { name: "feelio_device", value: f.key, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "feelio_locale", value: f.locale, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
}

const TEXT = {
  en: { ai: "I'm Feelio, a friendly AI", gate: "Open the gate", next: "Next" },
  ar: { ai: "أنا فيليو، ذكاء اصطناعي ودود", gate: "افتح البوابة", next: "التالي" },
} as const;

for (const locale of ["en", "ar"] as const) {
  for (const [orient, viewport] of [["landscape", LANDSCAPE], ["portrait", PORTRAIT]] as const) {
    test(`onboarding → first map moment (${locale}, ${orient})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const f = fixture({ locale, talk: locale === "en", nickname: locale === "ar" ? "ليلى" : null });
      await asChild(page, f);

      await page.goto(APP);
      await expect(page).toHaveURL(`${APP}/hello`);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");

      // Stop 1: the AI disclosure is visible on the sign and in what Feelio says.
      await expect(page.getByTestId("ai-sign")).toContainText(TEXT[locale].ai);
      await page.screenshot({ path: `${SHOTS}/${locale}-${orient}-1-hello.png` });
      await page.getByTestId("onb-next").click();

      // Stop 2: character (colour → companion → name). One character for now (D-053).
      await expect(page.getByTestId("onboarding")).toHaveAttribute("data-stop", "character");
      await page.getByTestId("colour-sky").click();
      await page.getByTestId("companion-heart").click();
      await page.screenshot({ path: `${SHOTS}/${locale}-${orient}-2-character.png` });
      if (locale === "ar") await page.getByTestId("name-parent").click();
      else await page.getByTestId("name-pip").click();
      await page.getByTestId("onb-next").click();

      // Resume: a reload mid-flow comes back to the next stop.
      await expect(page.getByTestId("onboarding")).toHaveAttribute("data-stop", "likes");
      await page.reload();
      await expect(page.getByTestId("onboarding")).toHaveAttribute("data-stop", "likes");

      // Stop 3: likes (max three).
      for (const id of ["space", "music", "sea", "animals"]) await page.getByTestId(`like-${id}`).click();
      await expect(page.locator('[data-testid^="like-"][aria-pressed="true"]')).toHaveCount(3);
      await page.screenshot({ path: `${SHOTS}/${locale}-${orient}-3-likes.png` });
      await page.getByTestId("onb-next").click();

      // Stop 4: microphone moment only when the parent turned Talk on.
      await expect(page.getByTestId("onboarding")).toHaveAttribute("data-stop", "mic");
      await expect(page.getByTestId("mic")).toHaveCount(locale === "en" ? 1 : 0);
      await page.getByTestId("onb-next").click();

      // Stop 5: the gate → the map, characters walk to Home.
      await expect(page.getByTestId("onboarding")).toHaveAttribute("data-stop", "gate");
      await page.getByTestId("onb-gate").click();
      await expect(page).toHaveURL(`${APP}/?arrive=1`, { timeout: 15_000 });
      await expect(page.getByRole("region")).toBeVisible();
      await expect(page.getByTestId("map-marker").locator("[data-pose]")).toBeVisible();
      await expect(page.locator("[data-avatar]").first()).toHaveAttribute("data-avatar", "bun-sky-heart");
      await expect(page.locator('[data-place="home"]')).toHaveAttribute("data-state", "current");
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SHOTS}/${locale}-${orient}-4-map.png` });

      // Collection shows the chosen character and name.
      await page.getByTestId("dock-collection").click();
      await expect(page.getByTestId("collection")).toBeVisible();
      await expect(page.getByTestId("child-name")).toContainText(locale === "ar" ? "ليلى" : "Pip");
      await page.screenshot({ path: `${SHOTS}/${locale}-${orient}-5-collection.png` });
    });
  }
}

test("map: places, locked 'not yet', place view, rotation, RTL dock order", async ({ page }) => {
  await page.setViewportSize(LANDSCAPE);
  const f = fixture({ locale: "ar", onboarded: true });
  await asChild(page, f);
  await page.goto(APP);
  await expect(page.getByRole("region")).toBeVisible();
  await expect(page.locator("button[data-place]")).toHaveCount(5);
  for (const id of ["park", "school", "club", "market"]) await expect(page.locator(`[data-place="${id}"]`)).toHaveAttribute("data-state", "locked");

  // A locked place: a gentle "not yet", never an error.
  await page.locator('[data-place="park"]').click();
  await expect(page.getByText("ليس بعد! لننهِ البيت أولًا.")).toBeVisible();

  // An open place: zoom in, five level stones, level 1 is the current one.
  await page.locator('[data-place="home"]').click();
  await expect(page.getByTestId("place-view")).toBeVisible();
  await expect(page.locator('[data-testid^="level-home-"]')).toHaveCount(5);
  await page.screenshot({ path: `${SHOTS}/ar-landscape-place.png` });
  await page.getByTestId("level-home-1").click();
  await expect(page.getByText("مغامرات هذا المكان ما زالت قيد الإعداد. عُد قريبًا!")).toBeVisible();
  await page.getByTestId("place-close").click();
  await expect(page.getByTestId("place-view")).toHaveCount(0);

  // Dock follows the reading direction: in Arabic the Map item is on the right.
  const mapBox = await page.getByTestId("dock-map").boundingBox();
  const colBox = await page.getByTestId("dock-collection").boundingBox();
  expect(mapBox!.x).toBeGreaterThan(colBox!.x);

  // The art is never mirrored, and the map switches orientation without losing state.
  await expect(page.locator("[data-orientation]")).toHaveAttribute("data-orientation", "horizontal");
  await page.setViewportSize(PORTRAIT);
  await expect(page.locator("[data-orientation]")).toHaveAttribute("data-orientation", "vertical");
  await expect(page.getByTestId("map-marker").locator("[data-pose]")).toBeVisible();
  await expect(page.locator('[data-place="home"]')).toHaveAttribute("data-state", "current");
  const transform = await page.locator("[data-orientation]").evaluate((el) => getComputedStyle(el).transform);
  expect(transform).not.toMatch(/matrix\(-/);
  await page.screenshot({ path: `${SHOTS}/ar-portrait-map-rotated.png` });
});

test("skip goes straight to the map with a default character", async ({ page }) => {
  await page.setViewportSize(PORTRAIT);
  await asChild(page, fixture({ locale: "en" }));
  await page.goto(APP + "/hello");
  await page.getByTestId("onb-skip").click();
  await expect(page).toHaveURL(`${APP}/`);
  await expect(page.getByTestId("map-marker").locator("[data-pose]")).toBeVisible();
});

test("daily time limit is enforced by the server: warm goodbye, no map", async ({ page }) => {
  await page.setViewportSize(LANDSCAPE);
  await asChild(page, fixture({ locale: "en", onboarded: true, dailyMinutes: 15, usedSeconds: 900 }));
  await page.goto(APP);
  await expect(page.getByTestId("time-up")).toBeVisible();
  await expect(page.getByRole("region")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/en-landscape-timeup.png` });
});

test("Stories switched off by the parent: no dock item, and the page is unreachable", async ({ page }) => {
  await page.setViewportSize(LANDSCAPE);
  await asChild(page, fixture({ locale: "en", onboarded: true, stories: false }));
  await page.goto(APP);
  await expect(page.getByTestId("dock-stories")).toHaveCount(0);
  await page.goto(APP + "/stories");
  await expect(page).toHaveURL(`${APP}/`);
});

test("child APIs refuse bad input and other origins", async ({ page }) => {
  const f = fixture({ locale: "en" });
  await asChild(page, f);
  await page.goto(APP);
  const bad = await page.evaluate(async () =>
    (await fetch("/api/child/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ step: 2, nickname: "Real Name" }) })).status,
  );
  expect(bad).toBe(400);
  const res = await page.request.post(APP + "/api/child/onboarding", { data: { step: 1 }, headers: { origin: "http://evil.test" } });
  expect(res.status()).toBe(403);
});

test("dev hotspot editor exists in development", async ({ page }) => {
  await page.goto(APP + "/dev/editor");
  await expect(page.getByRole("heading", { name: "Hotspot editor (dev only)" })).toBeVisible();
});
