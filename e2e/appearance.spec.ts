/**
 * Screenshot and behavior tests over the gallery's Appearance page
 * (gallery/appearance.ts): the dialog in each color scheme, and what OK and
 * Cancel do to the page's scheme and to the site's Options menu.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme, siteMenu } from "./site";

const PAGE = "controls/appearance/";

async function openDialog(page: Page) {
  await page.getByRole("button", { name: "Appearance…" }).click();
  const box = page.getByRole("dialog", { name: "Appearance" });
  await expect(box).toBeVisible();
  return box;
}

for (const scheme of SCHEMES) {
  test(`the Appearance dialog in ${scheme.label}`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    const box = await openDialog(page);
    // The scheme the page wears is the one picked, and has the focus.
    await expect(box.getByRole("radio", { name: scheme.label })).toBeChecked();
    await expect(box.getByRole("radio", { name: scheme.label })).toBeFocused();
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-appearance.png`);
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
  });
}

test("OK dresses the page in the pick, and Options shows it", async ({ page }) => {
  await openPage(page, PAGE);
  const box = await openDialog(page);
  await box.locator("label", { hasText: "High Contrast" }).click();
  await box.getByRole("button", { name: "OK" }).click();
  await expect(box).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-scheme", "high_contrast");

  await siteMenu(page).getByRole("button", { name: "Options", exact: true }).click();
  const options = page.getByRole("menu", { name: "Options" });
  await expect(options.getByRole("menuitemradio", { name: "High Contrast" })).toHaveAttribute("aria-checked", "true");
  await expect(options.getByRole("menuitemradio", { name: "Standard" })).toHaveAttribute("aria-checked", "false");
});

test("Cancel leaves the page as it was, even after a pick", async ({ page }) => {
  await openPage(page, PAGE);
  const box = await openDialog(page);
  await box.locator("label", { hasText: "Skyline" }).click();
  await box.getByRole("button", { name: "Cancel" }).click();
  await expect(box).toBeHidden();
  await expect(page.locator("html")).not.toHaveAttribute("data-scheme", /./);
});
