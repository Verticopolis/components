/**
 * Screenshot and behavior tests over the gallery's docs sites page: the
 * package's TitleScreen.astro on its own page in a frame, and the package's
 * TitleBar.astro, which is this site's own header.
 */
import { test, expect, type Page } from "@playwright/test";

/** The page has no demos to wait for, only its fonts. */
async function openPage(page: Page): Promise<void> {
  await page.goto("/docs-sites/");
  await page.evaluate(() => document.fonts.ready);
}

test("the title screen, as a docs site's front page", async ({ page }) => {
  await openPage(page);
  const frame = page.frameLocator('[data-frame="title-screen"]');
  await expect(frame.getByRole("heading", { level: 1, name: "Verticopolis components" })).toBeVisible();
  await expect(frame.locator(".ts-word .tm")).toHaveText("™");
  await expect(frame.getByRole("link", { name: "Play the Game" })).toHaveAttribute("data-game-link", "");
  await expect(frame.getByRole("link", { name: "Browse the Gallery" })).toHaveClass("ts-btn primary");
  await expect(page.locator('[data-frame="title-screen"]')).toHaveScreenshot("docs-site-title-screen.png");
});

test("the title bar names the site and links the game and GitHub", async ({ page }) => {
  await openPage(page);
  const bar = page.locator(".vc-bar");
  await expect(bar.locator(".vc-bar-title")).toHaveAttribute("href", /\/$/);
  await expect(bar.getByRole("link", { name: "Play the game" })).toHaveAttribute("data-game-link", "");
  await expect(bar.locator(".vc-bar-github")).toHaveAttribute("href", "https://github.com/Verticopolis/components");
});
