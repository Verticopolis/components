/**
 * Screenshot and behavior tests over the gallery's Desktop pages and its
 * message boxes (gallery/desk.ts, deskLayout.ts, messageBoxes.ts): the desk
 * with its Start menu and a window menu open, and each message box, in
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
    test("the desk, with the Start menu and a window menu open", async ({ page }) => {
      await openPage(page, DESK);
      await pickScheme(page, scheme);
      await expect(desk(page)).toHaveScreenshot(`${scheme.slug}-desk.png`);

      const start = taskbar(page).getByRole("button", { name: "Start" });
      await start.click();
      const menu = page.getByRole("menu", { name: "Start" });
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
  const tools = page.locator("#g-desk-tools");
  await tower.getByRole("button", { name: "Maximize Sample Tower" }).click();
  await expect(tower).toHaveClass(/desk-maximized/);
  // The small windows stay on top and step below the tower's menu bar.
  await expect(tools).not.toHaveCSS("top", "8px");
  await expect(desk(page)).toHaveScreenshot("desk-maximized.png");
  await tower.getByRole("button", { name: "Restore Sample Tower" }).click();
  await expect(tower).not.toHaveClass(/desk-maximized/);
  await expect(tools).toHaveCSS("top", "8px");
});

test("the tower closes with its ✕ and opens again from the Start menu", async ({ page }) => {
  await openPage(page, DESK);
  const tower = page.locator("#g-desk-tower");
  await tower.getByRole("button", { name: "Close Sample Tower" }).click();
  await expect(tower).toBeHidden();
  await expect(task(page, "Sample Tower")).toHaveCount(0);
  await taskbar(page).getByRole("button", { name: "Start" }).click();
  await page.getByRole("menu", { name: "Start" }).getByRole("menuitem", { name: "Sample Tower" }).click();
  await expect(tower).toBeVisible();
  await expect(tower).toHaveClass(/desk-active/);
  await expect(task(page, "Sample Tower")).toHaveAttribute("aria-pressed", "true");
});

test("the Help window opens from the Help menu, follows its pages and comes to the front from inside", async ({
  page,
}) => {
  await openPage(page, DESK);
  const help = page.locator("#desk-win-help");
  await expect(help).toBeHidden();
  await page.locator("#g-desk-tower").getByRole("button", { name: "Help" }).click();
  await page.getByRole("menuitem", { name: "Player's Manual" }).click();
  await expect(help).toBeVisible();
  await expect(help).toHaveClass(/desk-active/);
  const bar = help.getByRole("group", { name: "Help" });
  await expect(bar.getByRole("button", { name: "Back" })).toBeDisabled();

  const manual = page.frameLocator("#desk-win-help iframe");
  await manual.getByRole("link", { name: "Elevators" }).click();
  await expect(help.locator(".desk-title-text")).toHaveText("Elevators - Player's Manual");
  await expect(bar.getByRole("button", { name: "Back" })).toBeEnabled();
  await expect(desk(page)).toHaveScreenshot("desk-help.png");

  await bar.getByRole("button", { name: "Back" }).click();
  await expect(help.locator(".desk-title-text")).toHaveText("Player's Manual");
  await expect(bar.getByRole("button", { name: "Forward" })).toBeEnabled();

  // A press inside the manual's frame never reaches the desk, yet it gives
  // Help the focus back.
  await page.locator("#g-desk-info .win-title .desk-title-text").click();
  await expect(help).not.toHaveClass(/desk-active/);
  await manual.getByRole("heading", { name: "Contents" }).click();
  await expect(help).toHaveClass(/desk-active/);

  // Its own menu bar sits under its title bar; File > Exit closes it.
  const menus = help.getByRole("navigation", { name: "Player's Manual menu" });
  await menus.getByRole("button", { name: "File" }).click();
  await help.getByRole("menuitem", { name: "Exit" }).click();
  await expect(help).toBeHidden();
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
  // The Start menu opens the Bulletin again.
  await taskbar(page).getByRole("button", { name: "Start" }).click();
  await page.getByRole("menu", { name: "Start" }).getByRole("menuitem", { name: "Bulletin" }).click();
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
    ["A warning…", "Sample Tower", "warning"],
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
