/**
 * Screenshot and behavior tests over the Information bar and status bar
 * (windows/bars/topBar and windows/bars/statusBar), on the frame page that
 * draws them over the game's desktop stylesheet, and on the gallery page that
 * shows that page in a frame.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, pickScheme } from "./site";
import { SCHEME_KEY } from "../site/schemeKey.mjs";

const FRAME = "/frames/information-bar/";

/** Open the frame page on its own, in `scheme`, once its fonts are in. */
async function openFrame(page: Page, scheme: string | null): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    },
    [SCHEME_KEY, scheme] as const,
  );
  await page.goto(FRAME);
  await expect(page.locator("#stat-money")).toHaveText("$1,284,500");
  await page.evaluate(() => document.fonts.ready);
}

for (const scheme of SCHEMES) {
  test(`the Information bar and status bar, ${scheme.label} scheme`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the bars keep their desktop width on every screen");
    await openFrame(page, scheme.value);
    await expect(page.locator("#g-bars")).toHaveScreenshot(`information-bar-${scheme.slug}.png`);
  });
}

test("the traffic meter steps through its levels and warns from Backed up on", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one screen covers the drawing");
  await openFrame(page, null);
  const traffic = page.locator("#traffic");
  await traffic.click();
  await expect(page.locator("#traffic-glyph")).toHaveAttribute("data-level", "busy");
  await expect(traffic).not.toHaveClass(/traffic-warn/);
  await traffic.press("Enter");
  await expect(page.locator("#traffic-glyph")).toHaveAttribute("data-level", "backed-up");
  await expect(traffic).toHaveAttribute("aria-label", "Traffic: Backed up, worst line on floor 1");
  await expect(traffic).toHaveClass(/traffic-warn/);
  await traffic.press(" ");
  await expect(page.locator("#traffic-label")).toHaveText("Gridlock");
  await expect(page.locator("#traffic-floor")).toHaveText(" · B2");
  await expect(page.locator("#g-bars")).toHaveScreenshot("information-bar-gridlock.png");
});

test("each button's press reaches the page, and the speed and the speaker show their state", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the gallery page's test presses a button in the frame on a phone");
  await openFrame(page, null);
  const said = page.locator("#g-bars-said");
  await page.getByRole("button", { name: "Fast speed" }).click();
  await expect(said).toHaveText("Fast pressed.");
  await expect(page.locator('#speed [data-speed="3"]')).toHaveClass(/active/);
  await expect(page.locator('#speed [data-speed="1"]')).not.toHaveClass(/active/);
  const speaker = page.getByRole("button", { name: "Mute sound" });
  await speaker.click();
  await expect(said).toHaveText("Sound off.");
  await expect(speaker).toHaveAttribute("aria-pressed", "true");
  // A grayed Redo stays focusable, and Enter on it still reaches the game.
  const redo = page.getByRole("button", { name: "Redo" });
  await expect(redo).toHaveAttribute("aria-disabled", "true");
  await redo.press("Enter");
  await expect(said).toHaveText(/^Redo pressed/);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(said).toHaveText("Save pressed.");
  await expect(page.locator("#sb-news")).toHaveAttribute("title", "🔥 A fire broke out on floor 12.");
  await expect(page.locator("#sb-hint")).toBeHidden();
});

test("the gallery page shows the bars in a frame that follows the picked scheme", async ({ page }) => {
  // The page has no demos of its own to wait for, only the frame.
  await page.goto("/desktop/information-bar/");
  const frame = page.frameLocator('[data-frame="information-bar"]');
  await expect(frame.locator("#stat-pop")).toHaveText("2,418");
  // The frame scrolls to a button past its edge, and a tap reaches the page.
  await frame.getByRole("button", { name: "Install Verticopolis" }).click();
  await expect(frame.locator("#g-bars-said")).toHaveText("Install pressed.");
  await pickScheme(page, SCHEMES[2]);
  await expect(frame.locator("html")).toHaveAttribute("data-scheme", "high_contrast");
  await pickScheme(page, SCHEMES[0]);
  await expect(frame.locator("html")).not.toHaveAttribute("data-scheme", /./);
});
