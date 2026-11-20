/**
 * Screenshot tests over the component gallery: each section of chrome (the
 * page window, buttons, windows, wells, the menu bar closed and open, the
 * icons) in each color scheme, and every tower scene and room sprite once.
 * The projects in playwright.config.ts run it on a desktop and a phone screen.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";

const SCHEMES = [
  { label: "Classic", slug: "classic" },
  { label: "Skyline", slug: "skyline" },
  { label: "High contrast", slug: "high-contrast" },
] as const;

const SECTIONS = [
  { title: "Buttons", slug: "buttons" },
  { title: "Windows", slug: "windows" },
  { title: "Wells, fields and key-value rows", slug: "wells" },
  { title: "Icons", slug: "icons" },
] as const;

const MENUS = [
  { title: "File", slug: "file" },
  { title: "Options", slug: "options" },
  { title: "Help", slug: "help" },
] as const;

async function openGallery(page: Page, schemeLabel: string): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as { galleryReady?: boolean }).galleryReady === true);
  const button = page
    .getByRole("group", { name: "Color scheme" })
    .getByRole("button", { name: schemeLabel, exact: true });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => document.fonts.ready);
}

function section(page: Page, title: string): Locator {
  return page
    .locator("section.g-section")
    .filter({ has: page.getByRole("heading", { level: 2, name: title, exact: true }) });
}

/** The smallest page area holding every given element, for shots of an open
 *  menu, whose list hangs outside the bar's own box. */
async function unionClip(...locators: Locator[]): Promise<{ x: number; y: number; width: number; height: number }> {
  const boxes = await Promise.all(locators.map((l) => l.boundingBox()));
  const present = boxes.filter((b): b is NonNullable<typeof b> => b !== null);
  if (present.length !== locators.length) throw new Error("an element to shoot is not on the page");
  const x = Math.floor(Math.min(...present.map((b) => b.x)));
  const y = Math.floor(Math.min(...present.map((b) => b.y)));
  const right = Math.ceil(Math.max(...present.map((b) => b.x + b.width)));
  const bottom = Math.ceil(Math.max(...present.map((b) => b.y + b.height)));
  return { x, y, width: right - x, height: bottom - y };
}

function fileSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

for (const scheme of SCHEMES) {
  test.describe(`${scheme.label} scheme`, () => {
    test.beforeEach(async ({ page }) => {
      await openGallery(page, scheme.label);
    });

    test("page window and scheme switcher", async ({ page }) => {
      await expect(page.locator(".page-win > .win-title")).toHaveScreenshot(`${scheme.slug}-page-title.png`);
      await expect(page.locator(".page-lede")).toHaveScreenshot(`${scheme.slug}-page-lede.png`);
      await expect(page.locator(".g-schemes")).toHaveScreenshot(`${scheme.slug}-schemes.png`);
    });

    for (const s of SECTIONS) {
      test(s.title, async ({ page }) => {
        await expect(section(page, s.title)).toHaveScreenshot(`${scheme.slug}-${s.slug}.png`);
      });
    }

    test("menu bar, closed and with each menu open", async ({ page }) => {
      const bar = page.getByRole("navigation", { name: "Sample menu" });
      await expect(bar).toHaveScreenshot(`${scheme.slug}-menu-closed.png`);
      for (const m of MENUS) {
        await bar.getByRole("button", { name: m.title, exact: true }).click();
        const list = page.getByRole("menu", { name: m.title });
        await expect(list).toBeVisible();
        await expect(page).toHaveScreenshot(`${scheme.slug}-menu-${m.slug}.png`, { clip: await unionClip(bar, list) });
        await page.keyboard.press("Escape");
        await expect(list).toBeHidden();
      }
    });
  });
}

// The painters draw on a canvas and read no stylesheet, so each scene and
// sprite is shot once, in the classic scheme; the phone project still shoots
// them at its own pixel ratio.
test("tower scenes", async ({ page }) => {
  await openGallery(page, "Classic");
  const scenes = page.locator(".g-scenes figure");
  const count = await scenes.count();
  expect(count).toBeGreaterThan(0);
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const scene = scenes.nth(i);
    const name = fileSlug((await scene.locator("figcaption strong").textContent()) ?? `scene-${i}`);
    expect(seen.has(name), `two scenes are both named ${name}`).toBe(false);
    seen.add(name);
    await expect(scene.locator("canvas")).toHaveScreenshot(`scene-${name}.png`);
  }
});

test("room sprites", async ({ page }) => {
  await openGallery(page, "Classic");
  const cells = page.locator(".g-sprites figure");
  const count = await cells.count();
  expect(count).toBeGreaterThan(0);
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const cell = cells.nth(i);
    const name = fileSlug((await cell.locator("figcaption").textContent()) ?? `sprite-${i}`);
    expect(seen.has(name), `two sprites are both named ${name}`).toBe(false);
    seen.add(name);
    await expect(cell).toHaveScreenshot(`sprite-${name}.png`);
  }
});
