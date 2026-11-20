import { defineConfig } from "@playwright/test";

// Screenshot tests for the component gallery (site/, with its demos in
// gallery/): every piece the package draws, in each color scheme, on a
// desktop and a phone screen. The web server builds the package and the
// gallery site, then serves the built site, so the shots come from lib/ the
// way a consumer would load it. The site's own packages come first
// (`npm run gallery:install`).
//
// Glyph and canvas rasterization differ across Chromium builds, so the
// baselines are minted only inside the pinned Playwright image (the
// Screenshots workflow, or the same image locally; see README.md). A run on
// another browser still drives the page but skips the pixel comparison; set
// PW_VISUAL=1 to compare anyway.
const PORT = 4174;

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide" },
  },
  ignoreSnapshots: !process.env.CI && !process.env.PW_VISUAL,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: "chromium",
    // Sandboxes without Playwright's own browser can point at a preinstalled
    // Chromium. Unset (the normal case, CI included) uses Playwright's.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
    },
    {
      name: "phone",
      use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `npm run build && npm run gallery:build && npm run --prefix site preview -- --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
