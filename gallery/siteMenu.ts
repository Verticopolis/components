/**
 * The gallery site's own Win95 menu bar (site/src/components/MenuBar.astro),
 * the package's `MenuBar` drawn from the site's model: File (play the game,
 * the package on npm, its source, print), Edit (find, copy this page's link),
 * Options (light, dark or the device's look, and the color scheme the demos
 * wear) and Help (the player's manual, the engine docs, report a problem).
 * The bar's behavior (opening, pointing, the keys) is the package's; this
 * module only says what each item is and does.
 *
 * Nothing runs until someone opens a menu or picks an item. Opening a menu
 * redraws the bar once, so Options checks the look and scheme in use.
 */
import { MenuBar, type MenuBarModel, type MenuItemModel } from "../lib/ui/menuBar.js";

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
  /** The color scheme the page wears ("standard" when none is set). */
  readonly scheme: () => string;
  readonly setScheme: (scheme: string) => void;
}

/** Where the menu's links go. */
export interface SiteLinks {
  readonly game: string;
  readonly npm: string;
  readonly github: string;
  readonly playerHelp: string;
  readonly engineDocs: string;
  readonly issues: string;
}

/** A color scheme the Options menu offers. */
export interface SiteScheme {
  readonly label: string;
  readonly value: string;
}

const THEMES: ReadonlyArray<readonly [SiteTheme, string]> = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["auto", "Match My Device"],
];

/** The site's menu bar, with the look and scheme in use checked. */
export function siteMenuModel(deps: SiteMenuDeps, links: SiteLinks, schemes: readonly SiteScheme[]): MenuBarModel {
  const theme = deps.theme();
  const scheme = deps.scheme();
  const radio = (label: string, checked: boolean, onPick: () => void): MenuItemModel => ({
    label,
    checked,
    radio: true,
    onPick,
  });
  return {
    id: "site-menubar",
    label: "Site menu",
    className: "site-menubar print:hidden",
    menus: [
      {
        id: "sm-file",
        label: "File",
        mnemonic: 0,
        items: [
          { label: "Play Verticopolis", href: links.game },
          { label: "Get the Package on npm", href: links.npm },
          { label: "View the Source on GitHub", href: links.github },
          { kind: "separator" },
          { label: "Print…", shortcut: "Ctrl+P", onPick: () => deps.print() },
        ],
      },
      {
        id: "sm-edit",
        label: "Edit",
        mnemonic: 0,
        items: [
          { label: "Find…", shortcut: "Ctrl+K", onPick: () => deps.openSearch() },
          {
            label: "Copy Link to This Page",
            onPick: () => void deps.copyLink(deps.pageUrl()).catch(() => {}),
          },
        ],
      },
      {
        id: "sm-options",
        label: "Options",
        mnemonic: 0,
        items: [
          ...THEMES.map(([value, label]) => radio(label, value === theme, () => deps.setTheme(value))),
          { kind: "separator" },
          ...schemes.map((s) => radio(s.label, s.value === scheme, () => deps.setScheme(s.value))),
        ],
      },
      {
        id: "sm-help",
        label: "Help",
        mnemonic: 0,
        items: [
          { label: "Player's Manual", href: links.playerHelp },
          { label: "Engine Docs", href: links.engineDocs },
          { kind: "separator" },
          { label: "Report a Problem…", href: links.issues, target: "_blank", rel: "noopener noreferrer" },
        ],
      },
    ],
  };
}

/** Draw the site's menu bar into `root` and return it. */
export function mountSiteMenu(
  root: HTMLElement,
  deps: SiteMenuDeps,
  links: SiteLinks,
  schemes: readonly SiteScheme[],
): MenuBar {
  const bar: MenuBar = new MenuBar(root, siteMenuModel(deps, links, schemes), {
    onOpen: () => bar.render(siteMenuModel(deps, links, schemes)),
  });
  return bar;
}
