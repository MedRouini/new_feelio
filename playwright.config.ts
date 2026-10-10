import { defineConfig, devices } from "@playwright/test";

// E2E against a running dev server (npm run dev). The child app is on localhost:3000 and the
// dashboard on dashboard.localhost:3000 (D-032). Synthetic accounts only.
export default defineConfig({
  testDir: "tests/e2e",
  globalTeardown: "./tests/e2e/cleanup.ts",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  outputDir: ".playwright-mcp/test-results",
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "tablet-landscape", use: { ...devices["Desktop Chrome"], viewport: { width: 1180, height: 820 } } },
  ],
});
