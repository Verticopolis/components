/**
 * The gallery site's own Win95 menu bar (site/src/components/MenuBar.astro),
 * the package's `MenuBar` with the site's commands: File (play the game, the
 * package on npm, its source, print), Edit (find, copy this page's link),
 * Options (light, dark or the device's look, and the color scheme the demos
 * wear) and Help (the player's manual, the engine docs, report a problem).
 * The bar's behavior (opening, pointing, the keys) is the package's; this
 * module only says what each item does. Every item that runs a command
 * carries `data-site-item`, its name here.
 *
 * Nothing runs until someone opens a menu or picks an item.
 */
import { MenuBar } from "../lib/ui/menuBar.js";

/** The looks Starlight's theme switch offers. */
export type SiteTheme = "light" | "dark" | "auto";

/** What the menu needs from the page around it. */
export interface SiteMenuDeps {
  readonly print: () => void;
  /** Open the site's search box. */
  readonly openSearch: () => void;
  readonly copyLink: (url: string) => Promise<void>;
  /** This page's own address, the one Copy Link copies. */
  readonly pageUrl: () => string;
  readonly theme: () => SiteTheme;
  readonly setTheme: (theme: SiteTheme) => void;
  /** The color scheme the page wears ("classic" when none is set). */
  readonly scheme: () => string;
  readonly setScheme: (scheme: string) => void;
}

const THEME_ITEMS: Record<SiteTheme, string> = {
  light: "theme_light",
  dark: "theme_dark",
  auto: "theme_auto",
};

/** The Options item for a color scheme. */
const schemeItem = (scheme: string): string => `scheme_${scheme}`;

/** Wire the bar under `root` and return it. */
export function wireSiteMenu(root: HTMLElement, deps: SiteMenuDeps, schemes: readonly string[]): MenuBar {
  const actions: Record<string, () => void> = {
    print: () => deps.print(),
    find: () => deps.openSearch(),
    copy_link: () => void deps.copyLink(deps.pageUrl()).catch(() => {}),
    theme_light: () => deps.setTheme("light"),
    theme_dark: () => deps.setTheme("dark"),
    theme_auto: () => deps.setTheme("auto"),
  };
  for (const scheme of schemes) actions[schemeItem(scheme)] = () => deps.setScheme(scheme);

  root.addEventListener("click", (e) => {
    const picked = (e.target as Element | null)?.closest<HTMLElement>("[data-site-item]");
    if (!picked || !root.contains(picked)) return;
    actions[picked.dataset.siteItem ?? ""]?.();
  });

  return new MenuBar(root, {
    onOpen: (menu) => {
      const theme = deps.theme();
      for (const [value, code] of Object.entries(THEME_ITEMS) as Array<[SiteTheme, string]>) {
        menu.querySelector(`[data-site-item="${code}"]`)?.setAttribute("aria-checked", String(value === theme));
      }
      const scheme = deps.scheme();
      for (const value of schemes) {
        menu
          .querySelector(`[data-site-item="${schemeItem(value)}"]`)
          ?.setAttribute("aria-checked", String(value === scheme));
      }
    },
  });
}
