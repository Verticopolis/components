/**
 * The Win95 menu bar a Starlight docs site wears across the top of every
 * page (the player's manual, the engine docs, this package's gallery), so a
 * site reads like the game. Every site's bar has the same bones:
 *
 * - **File:** the site's own items (back to the game, the source), then Print.
 * - **Edit:** Find (the site's search) and Copy Link to This Page.
 * - **Options:** Light, Dark or Match My Device, and, when the site offers
 *   them, the appearance schemes (`windows/schemes`).
 * - **Help:** the site's own items.
 *
 * The site hands in its File and Help items and what the built-in items do
 * (`SiteMenuDeps`); `starlightDeps` and `schemeDeps` are those for a
 * Starlight page. Each built-in item carries a stable code
 * (`data-site-item`), and `picked` hears it, so a site can count picks
 * without a listener of its own.
 *
 * Cost: nothing runs until a menu opens or an item is picked. Opening a menu
 * draws the bar again once, so Options checks the look and scheme in use.
 */
import { MenuBar } from "./menuBar";
import type { MenuBarModel, MenuItemModel, MenuSeparatorModel } from "./menuBarTemplate";
import { SCHEMES, SCHEME_NAMES, applyScheme, saveScheme, schemeOf, type SchemeId } from "./schemes";

/** The looks Starlight's theme switch offers. */
export type SiteTheme = "light" | "dark" | "auto";

/** What the built-in items need from the page around the bar. */
export interface SiteMenuDeps {
  readonly print: () => void;
  /** Open the site's search box. */
  readonly openSearch: () => void;
  readonly copyLink: (url: string) => Promise<void>;
  /** This page's own address, the one Copy Link copies. */
  readonly pageUrl: () => string;
  readonly theme: () => SiteTheme;
  readonly setTheme: (theme: SiteTheme) => void;
  /** The scheme the page wears. With `setScheme`, Options lists the schemes. */
  readonly scheme?: () => SchemeId;
  readonly setScheme?: (scheme: SchemeId) => void;
  /** Hears each built-in item's code when it is picked (`print`, `find`,
   *  `copy_link`, `theme_light`, `theme_dark`, `theme_auto`, `scheme_<id>`). */
  readonly picked?: (code: string) => void;
}

/** An entry a site puts in its File or Help menu. */
export type SiteMenuEntry = MenuItemModel | MenuSeparatorModel;

/** The site's own items, and how its bar is named. */
export interface SiteMenuItems {
  /** File's items, above Print. */
  readonly file: readonly SiteMenuEntry[];
  /** Help's items. */
  readonly help: readonly SiteMenuEntry[];
  /** The `<nav>`'s id; `site-menubar` unless given. Each title's id starts
   *  with `sm-` (`sm-file`, `sm-edit`, `sm-options`, `sm-help`). */
  readonly id?: string;
  /** The `<nav>`'s accessible name; "Site menu" unless given. */
  readonly label?: string;
}

/** The Options item for each look, in order, with its code. */
const THEMES: ReadonlyArray<readonly [SiteTheme, string]> = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["auto", "Match My Device"],
];

/** The bar's model, with the look and scheme in use checked. */
export function siteMenuModel(deps: SiteMenuDeps, items: SiteMenuItems): MenuBarModel {
  const item = (code: string, entry: Omit<MenuItemModel, "onPick" | "data">, run: () => void): MenuItemModel => ({
    ...entry,
    data: { "site-item": code },
    onPick: () => {
      deps.picked?.(code);
      run();
    },
  });
  const radio = (code: string, label: string, checked: boolean, run: () => void) =>
    item(code, { label, checked, radio: true }, run);

  const theme = deps.theme();
  const themes = THEMES.map(([value, label]) =>
    radio(`theme_${value}`, label, value === theme, () => deps.setTheme(value)),
  );
  const setScheme = deps.setScheme;
  const scheme = deps.scheme?.();
  const schemes: SiteMenuEntry[] =
    setScheme && scheme
      ? [
          { kind: "separator" },
          ...SCHEMES.map((id) => radio(`scheme_${id}`, SCHEME_NAMES[id], id === scheme, () => setScheme(id))),
        ]
      : [];

  return {
    id: items.id ?? "site-menubar",
    label: items.label ?? "Site menu",
    className: "site-menubar print:hidden",
    menus: [
      {
        id: "sm-file",
        label: "File",
        mnemonic: 0,
        items: [
          ...items.file,
          ...(items.file.length ? [{ kind: "separator" } as const] : []),
          item("print", { label: "Print…", shortcut: "Ctrl+P" }, () => deps.print()),
        ],
      },
      {
        id: "sm-edit",
        label: "Edit",
        mnemonic: 0,
        items: [
          item("find", { label: "Find…", shortcut: "Ctrl+K" }, () => deps.openSearch()),
          item("copy_link", { label: "Copy Link to This Page" }, () => {
            void deps.copyLink(deps.pageUrl()).catch(() => {});
          }),
        ],
      },
      { id: "sm-options", label: "Options", mnemonic: 0, items: [...themes, ...schemes] },
      { id: "sm-help", label: "Help", mnemonic: 0, items: items.help },
    ],
  };
}

/** Draw the bar into `root` and return it. Each menu that opens draws the
 *  bar again first, so Options shows the look and scheme in use. */
export function mountSiteMenu(root: HTMLElement, deps: SiteMenuDeps, items: SiteMenuItems): MenuBar {
  const bar: MenuBar = new MenuBar(root, siteMenuModel(deps, items), {
    onOpen: () => bar.render(siteMenuModel(deps, items)),
  });
  return bar;
}

/** What the built-in items do on a Starlight page: print, open Starlight's
 *  search (once the click that picked Find is over), copy with the Clipboard
 *  API, and read and set the look through Starlight's own theme switch. */
export function starlightDeps(
  doc: Document = document,
): Pick<SiteMenuDeps, "print" | "openSearch" | "copyLink" | "pageUrl" | "theme" | "setTheme"> {
  const win = doc.defaultView ?? window;
  const themeSelect = () => doc.querySelector<HTMLSelectElement>("starlight-theme-select select");
  return {
    print: () => win.print(),
    // After the pick's own click has finished: Starlight's search closes on
    // a click outside its frame, and that click would otherwise reach it.
    openSearch: () =>
      void win.setTimeout(
        () => doc.querySelector<HTMLButtonElement>("site-search button[data-open-modal]")?.click(),
        0,
      ),
    // Async, so a page without the Clipboard API rejects rather than throws.
    copyLink: async (url) => win.navigator.clipboard.writeText(url),
    pageUrl: () => win.location.origin + win.location.pathname,
    theme: () => {
      const value = themeSelect()?.value;
      return value === "light" || value === "dark" ? value : "auto";
    },
    setTheme: (theme) => {
      const select = themeSelect();
      if (!select) return;
      select.value = theme;
      select.dispatchEvent(new Event("change"));
    },
  };
}

/** Options' schemes for a page that keeps the pick itself, under `key`: the
 *  scheme on `<html>`, set and kept on a pick. */
export function schemeDeps(key: string, doc: Document = document): Pick<SiteMenuDeps, "scheme" | "setScheme"> {
  const root = doc.documentElement;
  return {
    scheme: () => schemeOf(root),
    setScheme: (id) => {
      applyScheme(id, root);
      saveScheme(key, id);
    },
  };
}
