import { expect, test } from "@playwright/test";

const APP = "http://localhost:3000";
const DASH = "http://dashboard.localhost:3000";
const SHOTS = ".playwright-mcp/shots";
// Node's DNS (used by Playwright's API requests) doesn't resolve *.localhost on Windows, so API
// calls to the dashboard go to localhost with the dashboard Host header: same routing code path.
const DASH_HOST = { host: "dashboard.localhost:3000" };

test("Milestone 1: parent sign-up → consent → child → device setup → child app → deletion", async ({ page, request }) => {
  const email = `test+e2e-${Date.now()}@example.test`;
  const password = "correct-horse-battery";

  // 1. Child host without a device key: friendly "ask a grown-up" screen.
  await page.goto(APP);
  await expect(page.getByTestId("not-set-up")).toBeVisible();
  await expect(page.getByTestId("not-set-up")).toContainText("A grown-up needs to set me up");
  await expect(page.getByTestId("grownup-door")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/01-child-not-set-up.png` });

  // 2. Parent surfaces are unreachable on the child host.
  for (const p of ["/parent", "/api/parent/children", "/api/auth/get-session"]) {
    expect((await request.get(APP + p)).status(), p).toBe(404);
  }
  // …and child APIs are unreachable on the dashboard host.
  expect((await request.get(APP + "/api/child/me", { headers: DASH_HOST })).status()).toBe(404);
  // Child API without a key is refused.
  expect((await request.get(APP + "/api/child/me")).status()).toBe(401);

  // 3. Dashboard: signed-out visitors go to sign-in.
  await page.goto(DASH);
  await expect(page).toHaveURL(/\/sign-in/);
  await page.screenshot({ path: `${SHOTS}/02-dashboard-sign-in.png` });

  // 4. Sign up (adult confirmation required) → consent.
  await page.goto(DASH + "/sign-up");
  await page.getByLabel("Your name").fill("E2E Parent");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByLabel(/at least 18 years old/).check();
  await page.getByRole("button", { name: "Create a parent account" }).click();
  await expect(page).toHaveURL(/\/consent/);
  await expect(page.getByText("has not been reviewed by a lawyer yet")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/03-consent.png`, fullPage: true });

  // 5. Consent → home → add a child (Arabic).
  await page.getByLabel(/I give consent/).check();
  await page.getByRole("button", { name: "I agree" }).click();
  await expect(page.getByRole("heading", { name: "Your children" })).toBeVisible();
  await page.getByRole("link", { name: "Add a child" }).click();
  await page.getByLabel("Nickname (optional)").fill("Laila");
  await page.getByLabel("Age group").selectOption("5-6");
  await page.getByLabel("Child's language").selectOption("ar");
  await page.getByRole("button", { name: "Create profile" }).click();
  // Parent step 3: settings for this child, then step 4: hand the device over.
  await expect(page.getByRole("heading", { name: "Settings for Laila" })).toBeVisible();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("heading", { name: "Laila", exact: true })).toBeVisible();
  await expect(page.getByText(/Step 4 of 4/)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/04-child-detail.png`, fullPage: true });

  // 6. Set up this device → key handed to the child host → the child's onboarding, in Arabic, RTL.
  await page.getByRole("button", { name: "Set up this device for Laila" }).click();
  await expect(page).toHaveURL(APP + "/hello");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  // Feelio's first words say it is an AI (D-071: said once in onboarding, then shown on Talk and Story).
  await expect(page.getByTestId("onb-line")).toContainText("ذكاء اصطناعي ودود");
  await page.screenshot({ path: `${SHOTS}/05-child-home-ar.png` });

  // 7. The device cookie is httpOnly, host-only on the child host.
  const cookies = await page.context().cookies();
  const device = cookies.find((c) => c.name === "feelio_device");
  expect(device?.httpOnly).toBe(true);
  expect(device?.domain).toBe("localhost");

  // 8. Child scope works; parent scope is still refused with the child key.
  const me = await page.request.get(APP + "/api/child/me");
  expect(me.status()).toBe(200);
  expect(await me.json()).toMatchObject({ ageBand: "5-6", locale: "ar" });
  // The child's cookies (sent to localhost) are presented to the dashboard's parent API: refused.
  expect((await page.request.get(APP + "/api/parent/children", { headers: DASH_HOST })).status()).toBe(401);

  // 9. The parent was signed out on this device during setup.
  await page.goto(DASH);
  await expect(page).toHaveURL(/\/sign-in/);

  // 10. Sign back in (counts as the adult gate) and delete the account: real deletion path.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Your children" })).toBeVisible();
  await page.goto(DASH + "/account");
  await page.getByRole("button", { name: "Delete my account and all data" }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  // 11. The child device key died with the account.
  expect((await page.request.get(APP + "/api/child/me")).status()).toBe(401);
});

test("adult gate: a wrong password keeps the parent area closed", async ({ page }) => {
  const email = `test+gate-${Date.now()}@example.test`;
  await page.goto(DASH + "/sign-up");
  await page.getByLabel("Your name").fill("Gate Parent");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByLabel(/at least 18 years old/).check();
  await page.getByRole("button", { name: "Create a parent account" }).click();
  await expect(page).toHaveURL(/\/consent/);

  await page.goto(DASH + "/gate?level=sensitive&next=/account");
  await page.getByLabel("Password").fill("wrong-password-123");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await expect(page.getByText("That password isn't right.")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/06-gate-wrong.png` });

  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await expect(page).toHaveURL(/\/account/);
  await page.getByRole("button", { name: "Delete my account and all data" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
