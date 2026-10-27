import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// Stories (Milestone 6, D-070). Making a story spends model credits, so these tests stop at the magic
// button; reading uses a seeded story (the reviewed fallback text, Feelio stand-ins for pictures). The
// live making of stories is checked by scripts/story-probe.ts and scripts/picture-probe.ts.
const APP = "http://localhost:3000";
const SHOTS = ".playwright-mcp/shots/m6";
const LANDSCAPE = { width: 1180, height: 820 };
const PORTRAIT = { width: 390, height: 844 };

function fixture(opts: Record<string, unknown>): { key: string; locale: "en" | "ar"; storyId: string | null } {
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

test("workshop: four slots by tapping, then the magic button appears (nothing made, no credits)", async ({ page }) => {
  await page.setViewportSize(LANDSCAPE);
  await asChild(page, fixture({ locale: "en", onboarded: true, stories: true }));
  await page.goto(`${APP}/stories`);
  await expect(page.getByTestId("ai-line")).toHaveCount(0); // the library carries no AI notice (D-071)
  await page.getByTestId("make-story").click();
  await expect(page).toHaveURL(/\/stories\/make$/);
  await expect(page.getByTestId("ai-line")).toContainText("AI"); // the workshop does: one quiet line (D-071)
  await expect(page.getByTestId("make-it")).toHaveCount(0);
  const ask = { hero: "Who is the hero of our story?", place: "Where does the story happen?", feeling: "How does our hero feel in the adventure?", adventure: "What happens in the story?" };
  for (const slot of ["hero", "place", "feeling", "adventure"] as const) {
    await expect(page.getByTestId(`slot-${slot}`)).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("choice-picker")).toHaveAttribute("aria-label", ask[slot]); // this slot's picker has arrived
    await page.getByTestId("choose-this").click();
    await expect(page.getByTestId(`slot-${slot}`)).toHaveAttribute("data-selected");
  }
  await expect(page.getByTestId("make-it")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/workshop-ready.png` });
  // Tapping a filled slot opens it again to change it.
  await page.getByTestId("slot-hero").click();
  await expect(page.getByTestId("slot-hero")).toHaveAttribute("aria-current", "step");
});

for (const [name, viewport, reduce] of [["spread", LANDSCAPE, false], ["phone-reduced", PORTRAIT, true]] as const) {
  test(`the storybook (${name}): cover → 4 pages → the end, from the shelf`, async ({ page }) => {
    await page.setViewportSize(viewport);
    if (reduce) await page.emulateMedia({ reducedMotion: "reduce" });
    const f = fixture({ locale: "en", onboarded: true, stories: true, story: true });
    await asChild(page, f);
    await page.goto(`${APP}/stories`);
    await expect(page.getByTestId("book")).toHaveCount(1);
    await page.getByTestId("book").click();
    await expect(page).toHaveURL(new RegExp(`/stories/${f.storyId}$`));
    await expect(page.getByTestId("open-book")).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${name}-cover.png` });
    await page.getByTestId("open-book").click();
    await expect(page.getByTestId("page-1")).toContainText("Little Fox");
    await expect(page.getByTestId("book-wrap")).not.toHaveAttribute("data-turning");
    await page.screenshot({ path: `${SHOTS}/${name}-page1.png` });
    const settled = () => expect(page.getByTestId("book-wrap")).not.toHaveAttribute("data-turning");
    for (let i = 2; i <= 4; i++) {
      await settled();
      await page.getByTestId("next-page").click();
      await expect(page.getByTestId(`page-${i}`)).toBeVisible();
    }
    await settled();
    await page.getByTestId("next-page").click();
    await expect(page.getByText("The end")).toBeVisible();
    await expect(page.getByRole("button", { name: "Asking a friend" })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${name}-end.png` });
  });
}

test("Stories off: the bookshelf and the workshop don't exist for this child", async ({ page }) => {
  await asChild(page, fixture({ locale: "en", onboarded: true, stories: false }));
  await page.goto(`${APP}/stories`);
  await expect(page).toHaveURL(`${APP}/`);
  await page.goto(`${APP}/stories/make`);
  await expect(page).toHaveURL(`${APP}/`);
});
