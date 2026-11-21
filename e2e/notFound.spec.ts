/**
 * Screenshot and behavior tests over the "page not found" desk on its frame
 * page (gallery/notFound.ts): the desk filling the screen on a desktop and a
 * phone, and each pick telling a click from a middle click.
 */
import { test, expect } from "@playwright/test";
import { openPage } from "./site";

const PAGE = "frames/not-found/";

test("the desk fills the screen, with the message box, the skyline and the taskbar", async ({ page }) => {
  // The tray clock reads the time, so the shot fixes it; a masked clock still
  // moved the tray's edge as its width changed with the hour.
  await page.clock.setFixedTime(new Date(2026, 10, 15, 16, 34));
  await openPage(page, PAGE);
  await expect(page.getByRole("heading", { name: "Floor 404 hasn't been built yet." })).toBeVisible();
  await expect(page.locator(".nf-msg code")).toHaveText("/controls/elevator-music/");
  await expect(page.locator(".nf-tray time")).toHaveText("4:34 PM");
  await expect(page).toHaveScreenshot("not-found.png");
});

test("a pick names itself, a middle click as a new tab", async ({ page }) => {
  await openPage(page, PAGE);
  const task = page.locator(".nf-task");
  await page.getByRole("link", { name: "Read the docs" }).click();
  await expect(task).toHaveText("Read the docs");
  await page.getByRole("link", { name: "Close and go to the gallery" }).click({ button: "middle" });
  await expect(task).toHaveText("Close and go to the gallery (new tab)");
  await expect(page).toHaveURL(/frames\/not-found\/#?$/);
});
