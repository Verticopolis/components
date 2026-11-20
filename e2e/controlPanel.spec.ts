/**
 * Screenshot and behavior tests over the gallery's Control Panel page
 * (gallery/controlPanel.ts): the window in each color scheme, an icon's
 * press, a label the page changes, and the ✕.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const PAGE = "desktop/control-panel/";

const win = (page: Page) => page.locator("#desk-win-control");

for (const scheme of SCHEMES) {
  test(`the Control Panel, ${scheme.label} scheme`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    await expect(win(page)).toBeVisible();
    await expect(page.locator(".g-control")).toHaveScreenshot(`${scheme.slug}-control-panel.png`);
  });
}

test("an icon's press reaches the page, which renames Sounds, and the ✕ closes the window", async ({ page }) => {
  await openPage(page, PAGE);
  const said = page.locator(".g-control-said");
  await win(page).getByRole("button", { name: "Display" }).click();
  await expect(said).toHaveText("Display pressed.");
  await win(page).getByRole("button", { name: "Sounds: On" }).click();
  await expect(win(page).getByRole("button", { name: "Sounds: Off" })).toBeVisible();
  await win(page).getByRole("button", { name: "Close Control Panel" }).click();
  await expect(win(page)).toBeHidden();
  await page.getByRole("button", { name: "Open Control Panel" }).click();
  await expect(win(page)).toBeVisible();
});
