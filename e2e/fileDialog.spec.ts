/**
 * Screenshot and behavior tests over the gallery's Open and Save As page
 * (gallery/fileDialog.ts): the Open window in each color scheme, Save As
 * asking before it replaces a file, a row's menu and Previous Versions, a
 * linked folder waiting for the player's OK, and the focus rings a keyboard
 * player sees.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const PAGE = "controls/file-dialog/";

async function openWindow(page: Page, button: string, title: string) {
  await page.getByRole("button", { name: button, exact: true }).click();
  const box = page.getByRole("dialog", { name: title, exact: true });
  await expect(box).toBeVisible();
  return box;
}

for (const scheme of SCHEMES) {
  test(`the Open window in ${scheme.label}`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    const box = await openWindow(page, "Open…", "Open");
    await expect(box.locator(".fd-row")).toHaveCount(5);
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-file-open.png`);
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
  });
}

test("Save As asks before replacing a file, and offers the next free name", async ({ page }) => {
  await openPage(page, PAGE);
  const box = await openWindow(page, "Save As…", "Save As");
  await expect(box.locator("#fd-name")).toHaveValue("Harbor Point");
  await box.getByRole("button", { name: "Save", exact: true }).click();
  const ask = box.getByRole("alertdialog");
  await expect(ask).toContainText('"Harbor Point" already exists.');
  await expect(box.locator(".modal-box")).toHaveScreenshot("file-save-as-replace.png");
  await ask.getByRole("button", { name: 'Save as "Harbor Point (2)"' }).click();
  await expect(box).toBeHidden();
  const open = await openWindow(page, "Open…", "Open");
  await expect(open.getByRole("option", { name: "Harbor Point (2), Tower" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Put the sample folder back" }).click();
});

test("a row's menu opens Previous Versions, and Cancel puts the window back", async ({ page }) => {
  await openPage(page, PAGE);
  const box = await openWindow(page, "Open…", "Open");
  await box.getByRole("option", { name: "Skyline Plaza, Tower" }).click({ button: "right" });
  const menu = box.getByRole("menu", { name: "File" });
  await expect(menu.getByRole("menuitem")).toHaveText([
    "Open",
    "Rename",
    "Copy",
    "Paste",
    "Duplicate",
    "Delete",
    "Previous versions…",
  ]);
  await expect(box.locator(".modal-box")).toHaveScreenshot("file-row-menu.png");
  await menu.getByRole("menuitem", { name: "Previous versions…" }).click();
  const versions = page.getByRole("dialog", { name: "Previous Versions" });
  await expect(versions.getByRole("option")).toHaveCount(3);
  await expect(versions.locator(".modal-box")).toHaveScreenshot("file-previous-versions.png", {
    // The Modified times read in the runner's time zone.
    mask: [versions.locator(".pv-row .fd-cell:first-of-type")],
  });
  await versions.getByRole("button", { name: "Cancel" }).click();
  const back = page.getByRole("dialog", { name: "Open", exact: true });
  await expect(back.getByRole("option", { name: "Skyline Plaza, Tower" })).toHaveAttribute("aria-selected", "true");
});

test("a linked folder that wants the player's OK again shows the Allow access note", async ({ page }) => {
  await openPage(page, PAGE);
  const box = await openWindow(page, "Open a linked folder…", "Open");
  await expect(box.getByRole("button", { name: "Allow access…" })).toBeVisible();
  await expect(box.locator(".modal-box")).toHaveScreenshot("file-folder-allow.png");
});

/** Move focus with a key press first, so the browser draws the focus ring
 *  (`:focus-visible`) as it does for a keyboard player. */
async function keyboardFocus(page: Page, target: ReturnType<Page["locator"]>) {
  await page.keyboard.press("Shift");
  await target.focus();
  await expect(target).toBeFocused();
  expect(await target.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
}

for (const scheme of SCHEMES) {
  test(`the Open window's focus rings under the keyboard, ${scheme.label}`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    const box = await openWindow(page, "Open…", "Open");
    // The list holding the focus marks its selected row with a dotted ring.
    await box.getByRole("option", { name: "Skyline Plaza, Tower" }).click();
    await keyboardFocus(page, box.locator(".fd-rows"));
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-file-list-focus.png`);
    // Look in, opened from the keyboard, with an item holding the focus.
    await keyboardFocus(page, box.locator(".fd-look"));
    await page.keyboard.press("ArrowDown");
    const item = box.locator(".fd-look-item").first();
    await expect(item).toBeFocused();
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-file-look-in-focus.png`);
  });
}

test("Previous Versions opened from the keyboard rings its selected row", async ({ page }) => {
  await openPage(page, PAGE);
  await keyboardFocus(page, page.getByRole("button", { name: "Previous Versions…" }));
  await page.keyboard.press("Enter");
  const versions = page.getByRole("dialog", { name: "Previous Versions" });
  const row = versions.locator(".pv-row.selected");
  await expect(row).toBeFocused();
  expect(await row.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
  await expect(versions.locator(".modal-box")).toHaveScreenshot("file-previous-versions-focus.png", {
    mask: [versions.locator(".pv-row .fd-cell:first-of-type")],
  });
});
