/**
 * Screenshot and behavior tests over the gallery's Screen saver page
 * (gallery/screenSaver.ts): every saver held still on its monitor, the
 * dialog (with its moving monitor hidden from the shot), and a preview that
 * any key ends, and no focus ring on a saver the keyboard started.
 */
import { test, expect } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const PAGE = "desktop/screen-saver/";

test("each saver on its monitor", async ({ page }) => {
  await openPage(page, PAGE);
  const scenes = page.locator('[data-demo="saver-scenes"]');
  await expect(scenes.locator("figure")).toHaveCount(5);
  await expect(scenes).toHaveScreenshot("saver-scenes.png");
});

for (const scheme of SCHEMES) {
  test(`the Screen Saver dialog in ${scheme.label}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    await page.getByRole("button", { name: "Screen Saver…" }).click();
    const box = page.getByRole("dialog", { name: "Screen Saver", exact: true });
    await expect(box).toBeVisible();
    await expect(box.getByRole("combobox", { name: "Screen saver" })).toHaveValue("night");
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-saver-dialog.png`, {
      mask: [box.locator(".saver-screen")],
    });
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
  });
}

test("no saver grays the rest, and Preview plays one until a key ends it", async ({ page }) => {
  await openPage(page, PAGE);
  await page.getByRole("button", { name: "Screen Saver…" }).click();
  const box = page.getByRole("dialog", { name: "Screen Saver", exact: true });
  const pick = box.getByRole("combobox", { name: "Screen saver" });

  await pick.selectOption("none");
  await expect(box.getByRole("button", { name: "Preview" })).toBeDisabled();
  await expect(box.locator("#saver-wait")).toBeDisabled();

  await pick.selectOption("stars");
  await expect(box.getByRole("button", { name: "Preview" })).toBeEnabled();
  await box.getByRole("button", { name: "Preview" }).click();
  const saver = page.getByRole("dialog", { name: "Screen saver", exact: true });
  await expect(saver).toBeVisible();
  await expect(box).toBeHidden();

  // The press that started it does not end it; a key after the grace time does.
  await page.waitForTimeout(500);
  await page.keyboard.press("Space");
  await expect(saver).toBeHidden();
  await expect(box).toBeVisible();
  await expect(pick).toHaveValue("stars");
});

test("a saver started from the keyboard draws no focus ring, even in High Contrast", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPage(page, PAGE);
  await pickScheme(page, SCHEMES[2]);
  await page.getByRole("button", { name: "Screen Saver…" }).click();
  const box = page.getByRole("dialog", { name: "Screen Saver", exact: true });
  const preview = box.getByRole("button", { name: "Preview" });
  await page.keyboard.press("Shift");
  await preview.focus();
  await page.keyboard.press("Enter");
  const saver = page.getByRole("dialog", { name: "Screen saver", exact: true });
  await expect(saver).toBeFocused();
  expect(await saver.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
  expect(await saver.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none");
  await page.waitForTimeout(500);
  await page.keyboard.press("Space");
  await expect(saver).toBeHidden();
});
