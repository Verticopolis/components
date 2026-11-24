/**
 * Screenshot and behavior tests over the pocket desk (windows/desk/deskPocket
 * with styles/game/desk-pocket.css), on the gallery page that shows it in a
 * phone-shaped frame, and on the frame page held sideways.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, pickScheme } from "./site";

const PAGE = "/desktop/pocket-desk/";
const FRAME = "/frames/pocket-desk/";

/** Open the gallery page and wait for the pocket desk in its frame. */
async function openPage(page: Page) {
  await page.goto(PAGE);
  const frame = page.frameLocator('[data-frame="pocket-desk"]');
  await expect(frame.locator("#stat-pop")).toHaveText("2,418");
  await expect(frame.locator(".pal-tab").first()).toBeVisible();
  return frame;
}

for (const scheme of SCHEMES) {
  test(`the pocket desk on an upright phone, ${scheme.label} scheme`, async ({ page }) => {
    const frame = await openPage(page);
    await pickScheme(page, scheme);
    if (scheme.value) await expect(frame.locator("html")).toHaveAttribute("data-scheme", scheme.value);
    else await expect(frame.locator("html")).not.toHaveAttribute("data-scheme", /./);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-frame="pocket-desk"]')).toHaveScreenshot(`${scheme.slug}-pocket-desk.png`);
  });
}

test("the pocket desk held sideways puts Tools at the left of the tower", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one screen covers the sideways layout");
  await page.setViewportSize({ width: 720, height: 360 });
  await page.goto(FRAME);
  await expect(page.locator("#stat-pop")).toHaveText("2,418");
  const tools = await page.locator("#palette").boundingBox();
  const stage = await page.locator("#stage").boundingBox();
  expect(tools!.x + tools!.width).toBeLessThanOrEqual(stage!.x + 1);
  await expect(page).toHaveScreenshot("pocket-desk-sideways.png");
});

test("the tower fills the desk, and the Bulletin opens across its top from the Window menu and closes", async ({
  page,
}) => {
  const frame = await openPage(page);
  const desk = await frame.locator("#desk").boundingBox();
  const tower = await frame.locator("#desk-win-tower").boundingBox();
  expect(tower).toEqual(desk);
  await expect(frame.locator("#desk-win-tower .desk-btn-min")).toBeHidden();

  await frame.getByRole("button", { name: "Window" }).click();
  await frame.getByRole("menuitem", { name: "Bulletin" }).click();
  const bulletin = frame.locator("#bulletin-win");
  await expect(bulletin).toBeVisible();
  // Read both boxes together: the clicks may have scrolled the page.
  const [box, deskBox] = [await bulletin.boundingBox(), await frame.locator("#desk").boundingBox()];
  // Full width across the top of the desk, at most a third of its height, so the tower shows below.
  expect({ x: box!.x, y: box!.y, width: box!.width }).toEqual({ x: deskBox!.x, y: deskBox!.y, width: deskBox!.width });
  expect(box!.height).toBeLessThanOrEqual(deskBox!.height / 3 + 1);
  await expect(frame.locator(".desk-task", { hasText: "Bulletin" })).toBeVisible();

  await frame.getByRole("button", { name: "Close Bulletin" }).click();
  await expect(bulletin).toBeHidden();
});

test("a category tab shows its tools, and a press picks one", async ({ page }) => {
  const frame = await openPage(page);
  await frame.getByRole("tab", { name: /Transport/ }).click();
  const stairs = frame.locator('.pal-item[data-kind="stairs"]');
  await expect(stairs).toBeVisible();
  await stairs.click();
  await expect(stairs).toHaveClass(/active/);
});
