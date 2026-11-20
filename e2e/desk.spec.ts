/**
 * Screenshot and behavior tests over the gallery's Desktop pages and its
 * message boxes (gallery/desk.ts, deskLayout.ts, messageBoxes.ts): the desk
 * with its Verticopolis menu and a window menu open, and each message box, in
 * each color scheme; a maximized and a minimized window and the layout
 * drawings once. The presses work the package's own DeskWindow and
 * WindowMenu, so each test also checks what they did.
 */
import { test, expect, type Page } from "@playwright/test";
import { SCHEMES, openPage, pickScheme, unionClip } from "./site";

const DESK = "desktop/desk/";

function desk(page: Page) {
  return page.locator('[data-demo="desk"]');
}

function taskbar(page: Page) {
  return page.getByRole("toolbar", { name: "Taskbar" });
}

function task(page: Page, name: string) {
  return taskbar(page).getByRole("button", { name, exact: true });
}

for (const scheme of SCHEMES) {
  test.describe(`${scheme.label} scheme`, () => {
    test("the desk, with the Verticopolis menu and a window menu open", async ({ page }) => {
      await openPage(page, DESK);
      await pickScheme(page, scheme);
      await expect(desk(page)).toHaveScreenshot(`${scheme.slug}-desk.png`);

      const start = taskbar(page).getByRole("button", { name: "Verticopolis" });
      await start.click();
      const menu = page.getByRole("menu", { name: "Verticopolis" });
      await expect(menu).toBeVisible();
      await expect(start).toHaveAttribute("aria-expanded", "true");
      await expect(desk(page)).toHaveScreenshot(`${scheme.slug}-desk-start-menu.png`);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(start).toBeFocused();

      // The tower is in front at its own size: Restore is grayed, the rest work.
      await page.locator("#g-desk-tower > .win-title .desk-title-text").click({ button: "right" });
      const winMenu = page.getByRole("menu", { name: "Window" });
      await expect(winMenu).toBeVisible();
      await expect(winMenu.getByRole("menuitem", { name: "Restore" })).toBeDisabled();
      await expect(winMenu.getByRole("menuitem", { name: "Maximize" })).toBeEnabled();
      await expect(page).toHaveScreenshot(`${scheme.slug}-desk-window-menu.png`, {
        clip: await unionClip(page.locator("#g-desk-tower"), winMenu),
      });
      await page.keyboard.press("Escape");
      await expect(winMenu).toBeHidden();
    });

    test("a message box", async ({ page }) => {
      await openPage(page, "controls/message-boxes/");
      await pickScheme(page, scheme);
      await page.getByRole("button", { name: "A question…" }).click();
      const box = page.getByRole("dialog", { name: "Sample Tower" });
      await expect(box).toBeVisible();
      await expect(box.locator(".modal-box")).toHaveScreenshot(`${scheme.slug}-message-box-question.png`);
      await page.keyboard.press("Escape");
      await expect(box).toBeHidden();
    });
  });
}

test("a window maximizes and restores", async ({ page }) => {
  await openPage(page, DESK);
  const tower = page.locator("#g-desk-tower");
  await tower.getByRole("button", { name: "Maximize Sample Tower" }).click();
  await expect(tower).toHaveClass(/desk-maximized/);
  await expect(desk(page)).toHaveScreenshot("desk-maximized.png");
  await tower.getByRole("button", { name: "Restore Sample Tower" }).click();
  await expect(tower).not.toHaveClass(/desk-maximized/);
});

test("a window minimizes to the taskbar and comes back", async ({ page }) => {
  await openPage(page, DESK);
  const info = page.locator("#g-desk-info");
  await info.getByRole("button", { name: "Minimize Info" }).click();
  await expect(info).toHaveClass(/desk-minimized/);
  await expect(info).toBeHidden();
  await expect(task(page, "Info")).toHaveAttribute("aria-pressed", "false");
  // The Bulletin closes with its own ✕ and leaves the taskbar.
  await page.locator("#g-desk-bulletin").getByRole("button", { name: "Close Bulletin" }).click();
  await expect(page.locator("#g-desk-bulletin")).toBeHidden();
  await expect(task(page, "Bulletin")).toHaveCount(0);
  await expect(desk(page)).toHaveScreenshot("desk-minimized.png");

  await task(page, "Info").click();
  await expect(info).toBeVisible();
  await expect(info).toHaveClass(/desk-active/);
  await expect(task(page, "Info")).toHaveAttribute("aria-pressed", "true");
  // The Verticopolis menu opens the Bulletin again.
  await taskbar(page).getByRole("button", { name: "Verticopolis" }).click();
  await page.getByRole("menu", { name: "Verticopolis" }).getByRole("menuitem", { name: "Bulletin" }).click();
  await expect(page.locator("#g-desk-bulletin")).toBeVisible();
  await expect(task(page, "Bulletin")).toHaveAttribute("aria-pressed", "true");
});

test("the window menu works from a taskbar button's keys", async ({ page }) => {
  await openPage(page, DESK);
  await task(page, "Tools").focus();
  await page.keyboard.press("Shift+F10");
  const winMenu = page.getByRole("menu", { name: "Window" });
  await expect(winMenu).toBeVisible();
  // Tools never closes on the desk and never maximizes.
  await expect(winMenu.getByRole("menuitem", { name: "Close" })).toBeDisabled();
  await expect(winMenu.getByRole("menuitem", { name: "Maximize" })).toBeDisabled();
  await winMenu.getByRole("menuitem", { name: "Minimize" }).click();
  await expect(page.locator("#g-desk-tools")).toHaveClass(/desk-minimized/);
});

test("where windows open", async ({ page }) => {
  await openPage(page, "desktop/layout/");
  const figures = page.locator(".g-layout");
  await expect(figures).toHaveCount(3);
  for (let i = 0; i < 3; i++) await expect(figures.nth(i)).toHaveScreenshot(`desk-layout-${i + 1}.png`);
});

test("message boxes", async ({ page }) => {
  await openPage(page, "controls/message-boxes/");
  for (const [button, title, slug] of [
    ["A message…", "About Verticopolis components", "message"],
    ["A notice…", "Open", "notice"],
  ] as const) {
    await page.getByRole("button", { name: button }).click();
    const box = page.getByRole("dialog", { name: title });
    await expect(box).toBeVisible();
    await expect(box.locator(".modal-box")).toHaveScreenshot(`message-box-${slug}.png`);
    await box.getByRole("button", { name: "Close", exact: true }).first().click();
    await expect(box).toBeHidden();
  }
});
