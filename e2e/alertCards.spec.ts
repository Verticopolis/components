/**
 * Screenshot and behavior tests over the gallery's Alert cards and updates
 * page (gallery/alertCards.ts): the crash card and the update boxes in each
 * color scheme, the crash card keeping Escape and redrawing its status, and
 * the wait card closing on its own.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const PAGE = "controls/alert-cards/";

async function open(page: Page, button: string) {
  await page.getByRole("button", { name: button, exact: true }).click();
}

for (const scheme of SCHEMES) {
  test(`the crash card and the update boxes in ${scheme.label}`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    await open(page, "A crash card…");
    const card = page.getByRole("alertdialog", { name: "The program stopped" });
    await expect(card).toBeVisible();
    await expect(card).toHaveScreenshot(`${scheme.slug}-crash-card.png`);
    await card.getByRole("button", { name: "Close" }).click();
    await expect(card).toBeHidden();

    await open(page, "An update…");
    const box = page.getByRole("dialog", { name: "Update available" });
    await expect(box.getByRole("button", { name: "Later" })).toBeFocused();
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-update-box.png`);
    await box.getByRole("button", { name: "Later" }).click();
    await expect(box).toBeHidden();

    await open(page, "An update after several versions…");
    await expect(box.getByRole("region", { name: "What's new since 2.0.0" })).toBeVisible();
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-update-box-several.png`);
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
  });
}

test("the crash card keeps Escape, focuses its default button and redraws its status", async ({ page }) => {
  await openPage(page, PAGE);
  await open(page, "A crash card…");
  const card = page.getByRole("alertdialog", { name: "The program stopped" });
  await expect(card.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: "Report a bug (opens in a new tab)" })).toHaveAttribute(
    "target",
    "_blank",
  );
  const download = card.getByRole("button", { name: "Download report" });
  await download.click();
  await expect(card.locator(".crash-status")).toHaveText("Packing the report…");
  await expect(download).toBeDisabled();
  await expect(card.locator(".crash-status")).toHaveText("The report is ready. Check your downloads.");
  await expect(download).toBeEnabled();
  await card.getByRole("button", { name: "Close" }).click();
  await expect(card).toBeHidden();
});

test("the wait card has no buttons and closes when its wait ends", async ({ page }) => {
  await openPage(page, PAGE);
  await open(page, "A wait card…");
  const card = page.getByRole("dialog", { name: "Recovering graphics" });
  await expect(card).toBeVisible();
  await expect(card.getByRole("button")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(card).toBeVisible();
  await expect(card).toBeHidden({ timeout: 6_000 });
});
