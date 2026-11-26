/**
 * Screenshot and behavior tests over the gallery's Scenario lists page
 * (gallery/scenarioList.ts): the launch window in each color scheme, the
 * New Scenario dialog with a scenario and the sandbox picked, the keys that
 * move the pick, and Play from a row.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme } from "./site";

const PAGE = "controls/scenario-list/";

// The Endless Tower backdrop holds one seeded still frame, so the shots never
// catch it moving.
test.use({ contextOptions: { reducedMotion: "reduce" } });

async function openDialog(page: Page) {
  await page.getByRole("button", { name: "New Scenario…", exact: true }).click();
  const box = page.getByRole("dialog", { name: "New Scenario", exact: true });
  await expect(box).toBeVisible();
  return box;
}

for (const scheme of SCHEMES) {
  test(`the launch window in ${scheme.label}`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    const launch = page.locator(".sl-launch");
    await expect(launch.locator(".sl-row")).toHaveCount(3);
    await expect(launch).toHaveScreenshot(`${scheme.slug}-scenario-launch.png`);
  });

  test(`the New Scenario dialog in ${scheme.label}`, async ({ page }) => {
    await openPage(page, PAGE);
    await pickScheme(page, scheme);
    const box = await openDialog(page);
    await expect(box.getByRole("option", { selected: true })).toContainText("Morning Crush");
    await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-new-scenario.png`);
  });
}

test("the dialog shows a locked scenario's reason and keeps Play off", async ({ page }) => {
  await openPage(page, PAGE);
  const box = await openDialog(page);
  await box.getByRole("option", { name: /Night Line/ }).click();
  await expect(box.locator(".sl-lock")).toHaveText("Meet the Goal in Noon Rush to open it.");
  await expect(box.getByRole("button", { name: "Play", exact: true })).toBeDisabled();
  await expect(box.locator(".modal-box")).toHaveScreenshot("new-scenario-locked.png");
});

test("the arrow keys move the pick and Enter plays it", async ({ page }) => {
  await openPage(page, PAGE);
  const box = await openDialog(page);
  const list = box.getByRole("listbox", { name: "Scenarios" });
  await list.focus();
  await page.keyboard.press("Home");
  await expect(box.getByRole("option", { selected: true })).toContainText("Sandbox");
  await expect(box.locator(".sl-pane .sl-h")).toHaveText("Sandbox");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(box.getByRole("option", { selected: true })).toContainText("Noon Rush");
  await page.keyboard.press("Enter");
  await expect(box).toBeHidden();
  await expect(page.locator(".g-scenarios").getByRole("status")).toHaveText("Play Noon Rush.");
});

test("a row's Play button plays that scenario", async ({ page }) => {
  await openPage(page, PAGE);
  await page.getByRole("button", { name: "Play Morning Crush" }).click();
  await expect(page.locator(".g-scenarios").getByRole("status")).toHaveText("Play Morning Crush.");
  await expect(page.getByRole("button", { name: "Play Night Line" })).toHaveCount(0);
});
