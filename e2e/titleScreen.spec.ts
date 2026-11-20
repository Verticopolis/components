/**
 * Screenshot and behavior tests over the gallery's title screen page
 * (gallery/titleScreen.ts): the screen in each color scheme, a button press,
 * and the mute toggle's pressed state.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const PAGE = "desktop/title-screen/";

function frame(page: Page) {
  return page.locator('[data-demo="title-screen"] .g-title');
}

for (const scheme of SCHEMES) {
  test(`the title screen, ${scheme.label} scheme`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    await expect(frame(page).getByRole("img", { name: "Verticopolis" })).toBeVisible();
    await expect(frame(page)).toHaveScreenshot(`${scheme.slug}-title-screen.png`, { animations: "disabled" });
  });
}

test("the buttons and the mute corner answer a press", async ({ page }) => {
  await openPage(page, PAGE);
  const said = page.locator(".g-title-said");
  await frame(page).getByRole("button", { name: "New Tower" }).click();
  await expect(said).toHaveText("New Tower pressed.");

  const mute = frame(page).getByRole("button", { name: "Mute sound" });
  await expect(mute).toHaveAttribute("aria-pressed", "false");
  await mute.click();
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  await expect(said).toHaveText("Muted.");
});
