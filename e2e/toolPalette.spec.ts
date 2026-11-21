/**
 * Screenshot and behavior tests over the gallery's Tools window page
 * (gallery/palette.ts): the package's ToolPalette with made-up tools, in each
 * color scheme at one star, and with every tool unlocked, the funds low and a
 * category folded. The presses work the package's own palette, so each test
 * also checks what it did.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const TOOLS = "desktop/tools/";

function tool(page: Page, kind: string) {
  return page.locator(`.pal-item[data-kind="${kind}"]`);
}

/** The page's folds start empty, whatever an earlier test kept, unless the
 *  test marked a reload that keeps them. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("keep-folds")) localStorage.removeItem("vc-gallery-tools-folded");
  });
});

for (const scheme of SCHEMES) {
  test(`the Tools window at one star, ${scheme.label} scheme`, async ({ page }) => {
    await openPage(page, TOOLS);
    await pickScheme(page, scheme);
    await expect(tool(page, "shop")).toBeHidden();
    await expect(page.locator('.pal-group[data-group="Leisure"]')).toBeHidden();
    await expect(page.locator("#palette")).toHaveScreenshot(`${scheme.slug}-tools.png`);
  });
}

test("every tool unlocked, the funds low and a category folded", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a category folds where the headers show, from a tablet up");
  await openPage(page, TOOLS);
  await page.getByRole("button", { name: "5 stars" }).click();
  await expect(page.locator(".g-palette-said")).toHaveText("The tower has 5 stars.");
  await expect(page.locator('.pal-sub[data-sub-group="Leisure"]')).toBeVisible();
  await page.getByRole("button", { name: /^Funds/ }).click();
  await expect(tool(page, "cinema")).toHaveClass(/unaffordable/);
  await expect(tool(page, "floor")).not.toHaveClass(/unaffordable/);
  const header = page.getByRole("button", { name: "Commercial tools" });
  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "false");
  await expect(tool(page, "office")).toBeHidden();
  await page.mouse.move(0, 0);
  await expect(page.locator("#palette")).toHaveScreenshot("tools-unlocked-folded.png");
});

test("a pick by click or key reaches the page", async ({ page }) => {
  await openPage(page, TOOLS);
  const said = page.locator(".g-palette-said");
  await tool(page, "office").click();
  await expect(said).toHaveText("Office picked.");
  await expect(tool(page, "office")).toHaveClass(/active/);
  await tool(page, "lobby").focus();
  await expect(said).toHaveText("Lobby: A sample lobby, $5K.");
  await page.keyboard.press("Enter");
  await expect(said).toHaveText("Lobby picked.");
  await tool(page, "floor").focus();
  await page.keyboard.press("Space");
  await expect(said).toHaveText("Floor picked.");
  await expect(tool(page, "floor")).toHaveClass(/active/);
  await expect(tool(page, "office")).not.toHaveClass(/active/);
});

test("a fold keeps the picked tool in view and is kept on the next visit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a category folds where the headers show, from a tablet up");
  await openPage(page, TOOLS);
  await tool(page, "floor").click();
  await page.getByRole("button", { name: "Structure tools" }).click();
  await expect(page.locator('.pal-group[data-group="Structure"]')).toHaveClass(/pal-folded/);
  // The picked tool stays in view under its folded header.
  await expect(tool(page, "floor")).toBeVisible();
  await expect(tool(page, "lobby")).toBeHidden();
  await page.evaluate(() => sessionStorage.setItem("keep-folds", "1"));
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { galleryReady?: boolean }).galleryReady === true);
  await expect(page.locator('.pal-group[data-group="Structure"]')).toHaveClass(/pal-folded/);
});
