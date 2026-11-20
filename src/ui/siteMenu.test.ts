import { html, render } from "lit-html";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MenuItemModel } from "./menuBarTemplate";
import { mountSiteMenu, schemeDeps, siteMenuModel, starlightDeps, type SiteMenuDeps } from "./siteMenu";

/** Deps whose every hook is a spy; the look starts on "dark". */
function fakeDeps(more: Partial<Omit<SiteMenuDeps, "picked">> = {}) {
  return {
    print: vi.fn(),
    openSearch: vi.fn(),
    copyLink: vi.fn(() => Promise.resolve()),
    pageUrl: vi.fn(() => "https://example.test/page/"),
    theme: vi.fn(() => "dark" as const),
    setTheme: vi.fn(),
    picked: vi.fn(),
    ...more,
  };
}

const ITEMS = {
  file: [{ label: "Play", href: "https://example.test/play" }],
  help: [{ label: "Manual", href: "https://example.test/help" }],
};

/** The non-separator items of one menu, by its title id. */
function itemsOf(deps: SiteMenuDeps, menuId: string, items = ITEMS): MenuItemModel[] {
  const menu = siteMenuModel(deps, items).menus.find((m) => m.id === menuId)!;
  return menu.items.filter((e): e is MenuItemModel => !("kind" in e && e.kind === "separator"));
}

afterEach(() => {
  render(html``, document.body);
  document.documentElement.removeAttribute("data-scheme");
  localStorage.clear();
});

describe("siteMenuModel", () => {
  it("names the bar and lays out File, Edit, Options and Help", () => {
    const model = siteMenuModel(fakeDeps(), ITEMS);
    expect(model.id).toBe("site-menubar");
    expect(model.label).toBe("Site menu");
    expect(model.menus.map((m) => [m.id, m.label])).toEqual([
      ["sm-file", "File"],
      ["sm-edit", "Edit"],
      ["sm-options", "Options"],
      ["sm-help", "Help"],
    ]);
  });

  it("takes the bar's id and name from the site", () => {
    const model = siteMenuModel(fakeDeps(), { ...ITEMS, id: "docs-bar", label: "Docs menu" });
    expect(model.id).toBe("docs-bar");
    expect(model.label).toBe("Docs menu");
  });

  it("puts the site's File items above a separator and Print", () => {
    const file = siteMenuModel(fakeDeps(), ITEMS).menus[0]!.items;
    expect(file.map((e) => ("label" in e ? e.label : "separator"))).toEqual(["Play", "separator", "Print…"]);
  });

  it("leaves the separator out when the site has no File items", () => {
    const file = siteMenuModel(fakeDeps(), { file: [], help: [] }).menus[0]!.items;
    expect(file.map((e) => ("label" in e ? e.label : "separator"))).toEqual(["Print…"]);
  });

  it("hands Help the site's own items", () => {
    expect(itemsOf(fakeDeps(), "sm-help").map((i) => i.label)).toEqual(["Manual"]);
  });

  it("runs each built-in item and tells `picked` its code", async () => {
    const deps = fakeDeps();
    const [print] = itemsOf(deps, "sm-file").slice(-1);
    const [find, copy] = itemsOf(deps, "sm-edit");
    print!.onPick!(new MouseEvent("click"));
    find!.onPick!(new MouseEvent("click"));
    copy!.onPick!(new MouseEvent("click"));
    await Promise.resolve();
    expect(deps.print).toHaveBeenCalledOnce();
    expect(deps.openSearch).toHaveBeenCalledOnce();
    expect(deps.copyLink).toHaveBeenCalledWith("https://example.test/page/");
    expect(deps.picked.mock.calls.map((c) => c[0])).toEqual(["print", "find", "copy_link"]);
    expect([print, find, copy].map((i) => i!.data)).toEqual([
      { "site-item": "print" },
      { "site-item": "find" },
      { "site-item": "copy_link" },
    ]);
  });

  it("swallows a copy that the clipboard refuses", async () => {
    const deps = fakeDeps({ copyLink: vi.fn(() => Promise.reject(new Error("denied"))) });
    const [, copy] = itemsOf(deps, "sm-edit");
    expect(() => copy!.onPick!(new MouseEvent("click"))).not.toThrow();
    await Promise.resolve();
    expect(deps.copyLink).toHaveBeenCalledOnce();
  });

  it("checks the look in use and sets the one picked", () => {
    const deps = fakeDeps();
    const looks = itemsOf(deps, "sm-options");
    expect(looks.map((i) => [i.label, i.checked, i.radio])).toEqual([
      ["Light", false, true],
      ["Dark", true, true],
      ["Match My Device", false, true],
    ]);
    looks[2]!.onPick!(new MouseEvent("click"));
    expect(deps.setTheme).toHaveBeenCalledWith("auto");
    expect(deps.picked).toHaveBeenCalledWith("theme_auto");
  });

  it("lists no schemes unless the site can set one", () => {
    const options = siteMenuModel(fakeDeps({ scheme: () => "skyline" }), ITEMS).menus[2]!.items;
    expect(options).toHaveLength(3);
  });

  it("lists the schemes, checks the one in use and sets the one picked", () => {
    const setScheme = vi.fn();
    const deps = fakeDeps({ scheme: () => "skyline", setScheme });
    const options = siteMenuModel(deps, ITEMS).menus[2]!.items;
    expect("kind" in options[3]! && options[3].kind).toBe("separator");
    const schemes = itemsOf(deps, "sm-options").slice(3);
    expect(schemes.map((i) => [i.label, i.checked])).toEqual([
      ["Standard", false],
      ["Skyline", true],
      ["High Contrast", false],
    ]);
    schemes[2]!.onPick!(new MouseEvent("click"));
    expect(setScheme).toHaveBeenCalledWith("high_contrast");
    expect(deps.picked).toHaveBeenCalledWith("scheme_high_contrast");
  });
});

describe("mountSiteMenu", () => {
  it("draws the bar and checks the look in use each time a menu opens", () => {
    render(html`<div id="host"></div>`, document.body);
    let theme: "light" | "dark" = "light";
    const deps = fakeDeps({ theme: () => theme });
    mountSiteMenu(document.getElementById("host")!, deps, ITEMS);
    expect(document.querySelector("nav#site-menubar")?.getAttribute("aria-label")).toBe("Site menu");
    theme = "dark";
    document.getElementById("sm-options")!.click();
    const dark = document.querySelector<HTMLElement>('[data-site-item="theme_dark"]')!;
    expect(dark.getAttribute("aria-checked")).toBe("true");
  });
});

describe("starlightDeps", () => {
  /** A page with Starlight's theme select and search button. */
  function starlightPage(value: string) {
    const search = vi.fn();
    const changed = vi.fn();
    render(
      html`<starlight-theme-select
          ><select @change=${changed}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select></starlight-theme-select
        >
        <site-search><button data-open-modal @click=${search}>Search</button></site-search>`,
      document.body,
    );
    document.querySelector("select")!.value = value;
    return { search, changed };
  }

  it('reads the look from Starlight\'s select, and "auto" for anything else', () => {
    starlightPage("dark");
    expect(starlightDeps().theme()).toBe("dark");
    starlightPage("auto");
    expect(starlightDeps().theme()).toBe("auto");
    render(html``, document.body);
    expect(starlightDeps().theme()).toBe("auto");
  });

  it("sets the look through Starlight's select so its own listener runs", () => {
    const { changed } = starlightPage("light");
    starlightDeps().setTheme("dark");
    expect(document.querySelector("select")!.value).toBe("dark");
    expect(changed).toHaveBeenCalledOnce();
  });

  it("does nothing when the page has no theme select", () => {
    expect(() => starlightDeps().setTheme("dark")).not.toThrow();
  });

  it("opens Starlight's search once the click that picked Find is over", () => {
    vi.useFakeTimers();
    try {
      const { search } = starlightPage("light");
      starlightDeps().openSearch();
      expect(search).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(search).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects a copy where the page has no Clipboard API", async () => {
    const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    try {
      await expect(starlightDeps().copyLink("https://example.test/")).rejects.toThrow();
    } finally {
      if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard);
      else delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });

  it("copies the page's address without its query or hash", () => {
    expect(starlightDeps().pageUrl()).toBe(location.origin + location.pathname);
  });
});

describe("schemeDeps", () => {
  it("reads the scheme off <html> and sets and keeps the one picked", () => {
    const deps = schemeDeps("test-scheme");
    expect(deps.scheme!()).toBe("standard");
    deps.setScheme!("skyline");
    expect(document.documentElement.getAttribute("data-scheme")).toBe("skyline");
    expect(deps.scheme!()).toBe("skyline");
    expect(localStorage.getItem("test-scheme")).toBe("skyline");
  });
});
