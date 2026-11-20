/**
 * Screenshot tests over the component gallery site (site/, its demos in
 * gallery/demos.ts): the site's header and its own menu bar, each control
 * demo (buttons, windows, wells, icons, the sound board, the sample menu bar
 * closed and open) in each color scheme, and every tower scene and room
 * sprite once, every figure on the people page, and a check that each docs
 * page draws its diagrams. The projects in playwright.config.ts run it on a desktop and a
 * phone screen.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";

const SCHEMES = [
  { label: "Classic", value: null, slug: "classic" },
  { label: "Skyline", value: "skyline", slug: "skyline" },
  { label: "High Contrast", value: "high_contrast", slug: "high-contrast" },
] as const;

/** The control demos, each on its own page, shot in every scheme. */
const CONTROLS = [
  { path: "controls/buttons/", demo: "buttons", slug: "buttons" },
  { path: "controls/windows/", demo: "windows", slug: "windows" },
  { path: "controls/wells/", demo: "wells", slug: "wells" },
  { path: "controls/icons/", demo: "icons", slug: "icons" },
  { path: "sounds/", demo: "sounds", slug: "sounds" },
] as const;

const SAMPLE_MENUS = [
  { title: "File", slug: "file" },
  { title: "Options", slug: "options" },
  { title: "Help", slug: "help" },
] as const;

const SITE_MENUS = [
  { title: "File", slug: "file" },
  { title: "Edit", slug: "edit" },
  { title: "Options", slug: "options" },
  { title: "Help", slug: "help" },
] as const;

/** The pages of tower scenes, each scene shot once. */
const SCENE_PAGES = ["tower/lobbies/", "tower/stairs-and-escalators/", "tower/elevators/"] as const;

/** Open a page and wait for its demos to be built. */
async function openPage(page: Page, path: string): Promise<void> {
  await page.goto(`/${path}`);
  await page.waitForFunction(() => (window as unknown as { galleryReady?: boolean }).galleryReady === true);
  await page.evaluate(() => document.fonts.ready);
}

function siteMenu(page: Page): Locator {
  return page.getByRole("navigation", { name: "Site menu" });
}

/** Pick a color scheme from the site's Options menu, as a visitor would. */
async function pickScheme(page: Page, scheme: (typeof SCHEMES)[number]): Promise<void> {
  await siteMenu(page).getByRole("button", { name: "Options", exact: true }).click();
  await page.getByRole("menu", { name: "Options" }).getByRole("menuitemradio", { name: scheme.label }).click();
  if (scheme.value) await expect(page.locator("html")).toHaveAttribute("data-scheme", scheme.value);
  else await expect(page.locator("html")).not.toHaveAttribute("data-scheme", /./);
  await expect(page.getByRole("menu", { name: "Options" })).toBeHidden();
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
    test("site header", async ({ page }) => {
      await openPage(page, "controls/buttons/");
      await pickScheme(page, scheme);
      await expect(page.locator("header.header")).toHaveScreenshot(`${scheme.slug}-header.png`);
    });

    for (const c of CONTROLS) {
      test(c.slug, async ({ page }) => {
        await openPage(page, c.path);
        await pickScheme(page, scheme);
        await expect(page.locator(`[data-demo="${c.demo}"]`)).toHaveScreenshot(`${scheme.slug}-${c.slug}.png`);
      });
    }

    test("sample menu bar, closed and with each menu open", async ({ page }) => {
      await openPage(page, "controls/menu-bar/");
      await pickScheme(page, scheme);
      const bar = page.getByRole("navigation", { name: "Sample menu" });
      await expect(bar).toHaveScreenshot(`${scheme.slug}-menu-closed.png`);
      for (const m of SAMPLE_MENUS) {
        const title = bar.getByRole("button", { name: m.title, exact: true });
        await title.click();
        const list = bar.getByRole("menu", { name: m.title });
        await expect(list).toBeVisible();
        await expect(page).toHaveScreenshot(`${scheme.slug}-menu-${m.slug}.png`, { clip: await unionClip(bar, list) });
        // The keys work inside the open menu: Down moves into it, Escape
        // closes it and hands the focus back to its title.
        await page.keyboard.press("ArrowDown");
        await expect(list.locator(":focus")).toHaveCount(1);
        await page.keyboard.press("Escape");
        await expect(list).toBeHidden();
        await expect(title).toBeFocused();
      }
    });
  });
}

// The site's own menu bar wears the page's look, not a scheme's, so each menu
// is shot open once.
test("site menu bar, with each menu open", async ({ page }) => {
  await openPage(page, "controls/buttons/");
  const bar = siteMenu(page);
  for (const m of SITE_MENUS) {
    await bar.getByRole("button", { name: m.title, exact: true }).click();
    const list = bar.getByRole("menu", { name: m.title });
    await expect(list).toBeVisible();
    await expect(page).toHaveScreenshot(`site-menu-${m.slug}.png`, { clip: await unionClip(bar, list) });
    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
  }
});

// The painters draw on a canvas and read no stylesheet, so each scene and
// sprite is shot once, in the classic scheme; the phone project still shoots
// them at its own pixel ratio.
test("tower scenes", async ({ page }) => {
  const seen = new Set<string>();
  for (const path of SCENE_PAGES) {
    await openPage(page, path);
    const scenes = page.locator(".g-scenes figure");
    const count = await scenes.count();
    expect(count, `${path} has no scenes`).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const scene = scenes.nth(i);
      const name = fileSlug((await scene.locator("figcaption strong").textContent()) ?? `scene-${i}`);
      expect(seen.has(name), `two scenes are both named ${name}`).toBe(false);
      seen.add(name);
      await expect(scene.locator("canvas")).toHaveScreenshot(`scene-${name}.png`);
    }
  }
});

test("room sprites", async ({ page }) => {
  await openPage(page, "tower/rooms/");
  const cells = page.locator(".g-sprites figure");
  const count = await cells.count();
  expect(count).toBeGreaterThan(0);
  // Every room links to where the player's manual covers it (gallery/manual.ts).
  await expect(cells.filter({ has: page.locator("a.g-manual") })).toHaveCount(count);
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const cell = cells.nth(i);
    const name = fileSlug((await cell.locator("figcaption .g-name").textContent()) ?? `sprite-${i}`);
    expect(seen.has(name), `two sprites are both named ${name}`).toBe(false);
    seen.add(name);
    await expect(cell).toHaveScreenshot(`sprite-${name}.png`);
  }
});

test("people", async ({ page }) => {
  await openPage(page, "tower/people/");
  const figures = page.locator(".g-people figure");
  const count = await figures.count();
  expect(count).toBeGreaterThan(0);
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const fig = figures.nth(i);
    const name = fileSlug((await fig.locator("figcaption strong").textContent()) ?? `person-${i}`);
    expect(seen.has(name), `two people figures are both named ${name}`).toBe(false);
    seen.add(name);
    await expect(fig.locator("canvas")).toHaveScreenshot(`npc-${name}.png`);
  }
});

// The docs pages are the repository's own Markdown (site/pages.json); each
// mermaid block on them must come out as a drawn diagram, not an error.
test("docs pages draw every diagram", async ({ page }) => {
  for (const slug of ["architecture", "design-system", "audio", "atlas"]) {
    await page.goto(`/docs/${slug}/`);
    await expect(page.locator("html")).toHaveAttribute("data-diagrams", "drawn");
    const blocks = page.locator("pre.mermaid");
    await expect(blocks.locator("> svg")).toHaveCount(await blocks.count());
    await expect(page.locator('[aria-roledescription="error"]')).toHaveCount(0);
  }
});
