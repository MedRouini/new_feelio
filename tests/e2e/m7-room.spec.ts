import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// My room (D-074): dress-up, the gift box unlock, name and likes, Stories off, and a layout check that
// nothing overlaps at three sizes in both languages. Synthetic accounts only.

const APP = "http://localhost:3000";
const SHOTS = ".playwright-mcp/shots/m7";

function fixture(opts: Record<string, unknown>): { key: string; locale: "en" | "ar" } {
  const out = execFileSync("npx", ["tsx", "--conditions=react-server", "scripts/e2e-fixture.ts"], { shell: true, encoding: "utf8", env: { ...process.env, E2E_FIXTURES: "1", E2E_FIXTURE_OPTS: JSON.stringify(opts) } });
  return JSON.parse(out.trim().split("\n").pop()!);
}
async function asChild(page: Page, f: { key: string; locale: string }) {
  await page.context().addCookies([
    { name: "feelio_device", value: f.key, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "feelio_locale", value: f.locale, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
}
type Box = { x: number; y: number; width: number; height: number };
const overlap = (a: Box, b: Box) => a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1;

test("dress up: wear a free item, take it off, a locked item stays locked", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await asChild(page, fixture({ locale: "en", onboarded: true, stories: true }));
  await page.goto(`${APP}/collection`);
  await expect(page).toHaveURL(`${APP}/room`);
  await page.getByTestId("room-wardrobe").click();
  await expect(page.getByTestId("closeup-wardrobe")).toBeVisible();
  const saved = page.waitForResponse((r) => r.url().endsWith("/api/child/room") && r.request().method() === "POST");
  await page.getByTestId("wear-party_hat").click();
  await expect(page.getByTestId("wear-party_hat")).toHaveAttribute("aria-pressed", "true");
  expect((await saved).status()).toBe(200);
  await expect(page.getByTestId("wear-scarf")).toHaveAttribute("data-locked", "true");
  await page.getByTestId("wear-scarf").click();
  await expect(page.getByTestId("room-line")).toContainText("Keep playing to open this"); // review fix: true even with Stories off
  await expect(page.locator('[data-testid="room-line"] audio')).toHaveAttribute("src", /room_locked\.mp3$/); // review fix: heard, not only read
  await page.screenshot({ path: `${SHOTS}/wardrobe.png` });
  await page.getByTestId("closeup-back").click();
  await page.reload();
  await page.getByTestId("room-wardrobe").click();
  await expect(page.getByTestId("wear-party_hat")).toHaveAttribute("aria-pressed", "true"); // saved on the server
  await page.getByTestId("wear-party_hat").click();
  await expect(page.getByTestId("wear-party_hat")).toHaveAttribute("aria-pressed", "false");
});

test("the gift box opens one surprise when it is earned", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await asChild(page, fixture({ locale: "en", onboarded: true, stories: true, storyCount: 2 })); // 2 stories + 2 feelings = 4 points
  await page.goto(`${APP}/room`);
  await expect(page.getByTestId("room-line")).toContainText("surprise");
  await page.getByTestId("room-gift").click();
  await page.getByTestId("gift-open").click();
  await expect(page.getByTestId("room-line")).toContainText("Cosy scarf");
  await expect(page.getByTestId("gift-open")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/gift.png` });
  await page.getByTestId("closeup-back").click();
  await page.getByTestId("room-wardrobe").click();
  await expect(page.getByTestId("wear-scarf")).not.toHaveAttribute("data-locked", "true");
});

test("name and likes change from the room", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await asChild(page, fixture({ locale: "en", onboarded: true }));
  await page.goto(`${APP}/room`);
  await page.getByTestId("room-name").click();
  const balloon = page.locator('[data-testid^="name-"]').nth(1);
  const word = (await balloon.textContent())!.trim();
  await balloon.evaluate((el: HTMLElement) => el.click()); // the balloons bob: click this exact one, not a screen point
  await page.getByTestId("closeup-back").click();
  await expect(page.getByTestId("room-name")).toContainText(word);
  await page.getByTestId("room-pinboard").click();
  await page.getByTestId("like-toggle").click();
  await expect(page.locator('[data-testid^="picked-"]')).toHaveCount(1);
  await page.screenshot({ path: `${SHOTS}/likes.png` });
});

test("stories off: no book stack; the shelf and jar still open", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await asChild(page, fixture({ locale: "en", onboarded: true, stories: false, story: true }));
  await page.goto(`${APP}/room`);
  await expect(page.getByTestId("room-books")).toHaveCount(0);
  await page.getByTestId("room-jar").click();
  await expect(page.getByTestId("feeling-met")).toHaveCount(1);
  await page.getByTestId("closeup-back").click();
  await page.getByTestId("room-shelf").click();
  await expect(page.getByTestId("star")).toHaveCount(0);
});

for (const locale of ["en", "ar"] as const) {
  for (const [name, vp] of [
    ["tablet", { width: 1180, height: 820 }],
    ["wide", { width: 1920, height: 920 }],
    ["phone", { width: 390, height: 844 }],
  ] as const) {
    test(`layout: nothing overlaps (${locale}, ${name})`, async ({ page }) => {
      await page.setViewportSize(vp);
      await asChild(page, fixture({ locale, onboarded: true, stories: true, story: true }));
      await page.goto(`${APP}/room`);
      await page.waitForTimeout(800);
      const parts = page.locator('[data-room-part], [data-testid="room-line"], [data-testid^="dock-"], [data-testid="grownup-door"]');
      const boxes: { id: string; b: Box }[] = [];
      const n = await parts.count();
      for (let i = 0; i < n; i++) {
        const el = parts.nth(i);
        const b = await el.boundingBox();
        const id = (await el.getAttribute("data-testid")) ?? `character-and-name`;
        if (!b) continue;
        boxes.push({ id, b });
        expect(b.x, id).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width, id).toBeLessThanOrEqual(vp.width + 1);
      }
      const dock = boxes.filter((x) => x.id.startsWith("dock-"));
      const others = boxes.filter((x) => !x.id.startsWith("dock-"));
      for (let i = 0; i < others.length; i++) {
        for (let j = i + 1; j < others.length; j++) expect(overlap(others[i].b, others[j].b), `${others[i].id} × ${others[j].id}`).toBe(false);
        for (const d of dock) expect(overlap(others[i].b, d.b), `${others[i].id} × ${d.id}`).toBe(false);
      }
      await page.screenshot({ path: `${SHOTS}/${locale}-${name}.png` });
    });
  }
}

test("review fix: objects stay on the same spot of the room art in Arabic (the art never mirrors)", async ({ browser }) => {
  const centres: Record<string, Record<string, number>> = {};
  for (const locale of ["en", "ar"] as const) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
    await asChild(page, fixture({ locale, onboarded: true, stories: true }));
    await page.goto(`${APP}/room`);
    await expect(page.getByTestId("room-wardrobe")).toBeVisible();
    await page.waitForTimeout(800); // the opening layout animation settles first
    centres[locale] = {};
    for (const id of ["wardrobe", "shelf", "gift"]) {
      const b = (await page.getByTestId(`room-${id}`).boundingBox())!;
      centres[locale][id] = b.x + b.width / 2;
    }
    await page.close();
  }
  for (const id of ["wardrobe", "shelf", "gift"]) expect(Math.abs(centres.en[id] - centres.ar[id]), id).toBeLessThan(4);
});
