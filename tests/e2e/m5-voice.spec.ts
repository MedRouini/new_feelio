import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// Talk (Milestone 5, D-068): the screen itself, without starting a call (a call spends ElevenLabs
// minutes; the live call is checked by hand and by scripts/voice-proxy-check.ts). The AI sign is always
// there, the one big button is reachable above the dock on every size, and the screen does not exist
// when the parent has Talk off (server-side redirect).
const APP = "http://localhost:3000";
const SHOTS = ".playwright-mcp/shots/m5";
const SIZES = { phone: { width: 390, height: 844 }, tablet: { width: 1180, height: 820 }, desktop: { width: 1440, height: 900 } };

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

for (const locale of ["en", "ar"] as const) {
  test(`Talk screen (${locale}): AI sign, one big button clear of the dock on every size`, async ({ page }) => {
    await asChild(page, fixture({ locale, onboarded: true, talk: true }));
    for (const [name, size] of Object.entries(SIZES)) {
      await page.setViewportSize(size);
      await page.goto(`${APP}/talk`);
      await expect(page.getByTestId("ai-chip")).toBeVisible();
      const button = page.getByTestId("talk-toggle");
      await expect(button).toBeVisible();
      const b = (await button.boundingBox())!;
      const dock = (await page.locator("nav[data-dock]").boundingBox())!;
      expect(b.y + b.height, `${name}: button above the dock`).toBeLessThanOrEqual(dock.y);
      expect(b.height).toBeGreaterThanOrEqual(72);
      await button.click({ trial: true }); // nothing covers it
      await page.screenshot({ path: `${SHOTS}/talk-${locale}-${name}.png` });
    }
  });
}

test("Talk off: the screen does not exist for this child", async ({ page }) => {
  await asChild(page, fixture({ locale: "en", onboarded: true, talk: false }));
  await page.goto(`${APP}/talk`);
  await expect(page).not.toHaveURL(/\/talk$/);
  await expect(page.getByTestId("talk-toggle")).toHaveCount(0);
});
