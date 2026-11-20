/**
 * Screenshot and behavior tests over the Map window (windows/overviewMapWindow)
 * on the frame page that draws it in a stage of its own over a made-up tower
 * (gallery/mapWindow.ts). The presses work the package's own window, so each
 * test checks what it did to the pretend camera too.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES } from "./site";
import { SCHEME_KEY } from "../site/schemeKey.mjs";

const FRAME = "/frames/map-window/";

/** Open the frame page on its own, in `scheme`, once the map is painted. */
async function openFrame(page: Page, scheme: string | null): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    },
    [SCHEME_KEY, scheme] as const,
  );
  await page.goto(FRAME);
  await expect(page.locator("#overview-map")).toHaveAttribute("data-map-drawn", "true");
  await page.evaluate(() => document.fonts.ready);
}

for (const scheme of SCHEMES) {
  test(`the Map window, ${scheme.label} scheme`, async ({ page }) => {
    await openFrame(page, scheme.value);
    await expect(page.locator("#overview-map")).toHaveScreenshot(`map-${scheme.slug}.png`);
  });
}

test("the Hotel view counts its rooms in a legend, and Edit has none", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one screen covers the drawing");
  await openFrame(page, null);
  const legend = page.locator('.overview-map-legend[data-view="hotel"]');
  await expect(legend).toBeHidden();
  await page.getByRole("combobox", { name: "View" }).selectOption("hotel");
  await expect(legend).toBeVisible();
  await expect(legend).toHaveText("Dirty: 17Infested: 18");
  await expect(page.locator("#overview-map")).toHaveAttribute("data-map-drawn", "true");
  await expect(page.locator("#overview-map")).toHaveScreenshot("map-hotel.png");
  await page.getByRole("combobox", { name: "View" }).selectOption("edit");
  await expect(legend).toBeHidden();
});

test("the keys move the view, Escape closes the map and the Map button opens it", async ({ page }) => {
  await openFrame(page, null);
  const said = page.locator("#g-map-said");
  const map = page.getByRole("application", { name: /Tower map/ });
  await map.focus();
  await page.keyboard.press("Home");
  await expect(said).toHaveText(/^The view is centered on floor \d+\.$/);
  await expect(page.locator("#overview-map-summary")).toContainText("24 floors above ground and 3 basements");
  await page.keyboard.press("Escape");
  await expect(page.locator("#overview-map")).toBeHidden();
  const open = page.getByRole("button", { name: "Map" });
  await expect(open).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#overview-map")).toBeVisible();
  await expect(map).toBeFocused();
});

test("a tap moves the view there and tells the game where it landed", async ({ page }) => {
  await openFrame(page, null);
  const box = (await page.locator(".overview-map-view").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 30);
  await expect(page.locator("#g-map-said")).toContainText("A game opens the card");
});
