/**
 * Screenshot and behavior tests over the gallery's title screen page
 * (gallery/titleScreen.ts): the screen in each color scheme, the focus rings
 * a keyboard player sees, a button press and the mute toggle's pressed
 * state. Then the title screen on the desk (gallery/deskTitle.ts), on its
 * frame page over the game's whole stylesheet.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const PAGE = "desktop/title-screen/";
const DESK_FRAME = "/frames/desk-title/";

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

/** Move focus with a key press first, so the browser draws the focus ring
 *  (`:focus-visible`) as it does for a keyboard player. */
async function keyboardFocus(page: Page, target: Locator) {
  await page.keyboard.press("Shift");
  await target.focus();
  await expect(target).toBeFocused();
  expect(await target.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
}

for (const scheme of SCHEMES) {
  test(`a button's focus ring on the title screen, ${scheme.label} scheme`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    await keyboardFocus(page, frame(page).getByRole("button", { name: "New Tower" }));
    await expect(frame(page)).toHaveScreenshot(`${scheme.slug}-title-screen-focus.png`, { animations: "disabled" });
  });
}

test("the corners' focus rings on the title screen", async ({ page }) => {
  await openPage(page, PAGE);
  for (const [name, corner] of [
    ["mute", frame(page).getByRole("button", { name: "Mute sound" })],
    ["sponsor", frame(page).getByRole("link", { name: "Sponsor" })],
  ] as const) {
    await keyboardFocus(page, corner);
    await expect(frame(page)).toHaveScreenshot(`title-screen-focus-${name}.png`, { animations: "disabled" });
  }
});

/** The desk title frame in a scheme: the gallery page keeps the pick, and
 *  the frame page reads it as it loads. */
async function openDeskTitle(page: Page, scheme: (typeof SCHEMES)[number], query = "") {
  await openPage(page, PAGE);
  await pickScheme(page, scheme);
  await page.goto(`${DESK_FRAME}${query}`);
  await expect(page.locator("body")).toHaveClass(/desk-title/);
  await expect(page.locator(".desk-title-bar")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const scheme of SCHEMES) {
  test(`the title screen on the desk, ${scheme.label} scheme`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the desk title screen is a computer's");
    await openDeskTitle(page, scheme);
    await expect(page).toHaveScreenshot(`${scheme.slug}-desk-title.png`, { animations: "disabled" });
    await keyboardFocus(page, page.getByRole("button", { name: "New Tower" }));
    await expect(page).toHaveScreenshot(`${scheme.slug}-desk-title-focus.png`, { animations: "disabled" });
  });
}

test("a title screen that came up on a phone keeps its tall buttons on the desk", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the desk title screen is a computer's");
  await openDeskTitle(page, SCHEMES[0], "?phone");
  await expect(page.locator("#splash")).toHaveClass(/splash--mobile/);
  await expect(page).toHaveScreenshot("desk-title-from-phone.png", { animations: "disabled" });
});
