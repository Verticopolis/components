/** What the gallery's screenshot specs share: the color schemes, opening a
 *  page once its demos are built, picking a scheme from the site's own
 *  Options menu, and the area around an open menu. */
import { expect, type Locator, type Page } from "@playwright/test";

export const SCHEMES = [
  { label: "Standard", value: null, slug: "classic" },
  { label: "Skyline", value: "skyline", slug: "skyline" },
  { label: "High Contrast", value: "high_contrast", slug: "high-contrast" },
] as const;

/** Open a page and wait for its demos to be built. */
export async function openPage(page: Page, path: string): Promise<void> {
  await page.goto(`/${path}`);
  await page.waitForFunction(() => (window as unknown as { galleryReady?: boolean }).galleryReady === true);
  await page.evaluate(() => document.fonts.ready);
}

export function siteMenu(page: Page): Locator {
  return page.getByRole("navigation", { name: "Site menu" });
}

/** Pick a color scheme from the site's Options menu, as a visitor would. */
export async function pickScheme(page: Page, scheme: (typeof SCHEMES)[number]): Promise<void> {
  await siteMenu(page).getByRole("button", { name: "Options", exact: true }).click();
  await page.getByRole("menu", { name: "Options" }).getByRole("menuitemradio", { name: scheme.label }).click();
  if (scheme.value) await expect(page.locator("html")).toHaveAttribute("data-scheme", scheme.value);
  else await expect(page.locator("html")).not.toHaveAttribute("data-scheme", /./);
  await expect(page.getByRole("menu", { name: "Options" })).toBeHidden();
}

/** The smallest page area holding every given element, for shots of an open
 *  menu, whose list hangs outside the bar's own box. */
export async function unionClip(
  ...locators: Locator[]
): Promise<{ x: number; y: number; width: number; height: number }> {
  const boxes = await Promise.all(locators.map((l) => l.boundingBox()));
  const present = boxes.filter((b): b is NonNullable<typeof b> => b !== null);
  if (present.length !== locators.length) throw new Error("an element to shoot is not on the page");
  const x = Math.floor(Math.min(...present.map((b) => b.x)));
  const y = Math.floor(Math.min(...present.map((b) => b.y)));
  const right = Math.ceil(Math.max(...present.map((b) => b.x + b.width)));
  const bottom = Math.ceil(Math.max(...present.map((b) => b.y + b.height)));
  return { x, y, width: right - x, height: bottom - y };
}
