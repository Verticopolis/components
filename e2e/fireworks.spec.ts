/**
 * Screenshot and behavior tests over the gallery's Fireworks page
 * (gallery/fireworks.ts): the still frame reduced motion shows behind the
 * welcome box, the animated show going off, and closing the box ending it.
 */
import { test, expect } from "@playwright/test";
import { openPage } from "./site";

const PAGE = "desktop/fireworks/";

test("reduced motion shows one still frame of bursts behind the box", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPage(page, PAGE);
  await page.getByRole("button", { name: "Celebrate…" }).click();
  const box = page.getByRole("dialog", { name: "Welcome to the gallery" });
  await expect(box.getByRole("button", { name: "OK" })).toBeFocused();
  const sky = page.locator("#modal > canvas.launch-fireworks-sky");
  await expect(sky).toHaveAttribute("aria-hidden", "true");
  // The sidebar and the page links change as pages are added, so the shot
  // leaves them out.
  await expect(page).toHaveScreenshot("fireworks-still.png", {
    mask: [page.locator(".sidebar-pane"), page.locator(".pagination-links")],
  });
  await box.getByRole("button", { name: "OK" }).click();
  await expect(sky).toHaveCount(0);
});

test("the show goes off behind the box and ends when the box closes", async ({ page }) => {
  await openPage(page, PAGE);
  await page.getByRole("button", { name: "Celebrate…" }).click();
  const sky = page.locator("#modal > canvas.launch-fireworks-sky");
  await expect(sky).toHaveCount(1);
  // Some sparks are lit within the first second.
  await expect
    .poll(() =>
      sky.evaluate((c: HTMLCanvasElement) => {
        const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
        return false;
      }),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(sky).toHaveCount(0);
});
