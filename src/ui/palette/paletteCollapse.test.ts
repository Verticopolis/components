import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PALETTE_COLLAPSE_BUTTON_ID, PALETTE_COLLAPSED_CLASS, PaletteCollapse } from "./paletteCollapse";

describe("PaletteCollapse", () => {
  let win: HTMLElement;
  let store: Map<string, string>;
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  const button = () => document.getElementById(PALETTE_COLLAPSE_BUTTON_ID) as HTMLButtonElement;
  let desktop = true;

  beforeEach(() => {
    store = new Map();
    desktop = true;
    vi.spyOn(window, "matchMedia").mockImplementation(() => ({ matches: desktop }) as unknown as MediaQueryList);
    win = document.createElement("aside");
    win.id = "palette";
    const title = document.createElement("div");
    title.className = "win-title";
    title.textContent = "Tools";
    const list = document.createElement("div");
    list.className = "palette-scroll";
    list.id = "palette-scroll";
    win.append(title, list);
    document.body.replaceChildren(win);
  });
  afterEach(() => vi.restoreAllMocks());

  it("adds the button after the title, open by default", () => {
    new PaletteCollapse(win, { store: { key: "k", storage } });
    expect(win.querySelector(".win-title")!.textContent).toContain("Tools");
    expect(button().getAttribute("aria-expanded")).toBe("true");
    expect(button().getAttribute("aria-label")).toBe("Hide the Tools");
    expect(button().getAttribute("aria-controls")).toBe("palette-scroll");
    expect(win.classList.contains(PALETTE_COLLAPSED_CLASS)).toBe(false);
  });

  it("keeps the game's own title bar parts placed after it through a press", () => {
    new PaletteCollapse(win, {});
    const title = win.querySelector<HTMLElement>(".win-title")!;
    const max = document.createElement("button");
    max.className = "win-max";
    title.append(max);
    button().click();
    button().click();
    expect(title.contains(max)).toBe(true);
    expect([...title.children]).toEqual([button(), max]);
  });

  it("folds and opens on a press, keeps the choice, and tells the game", () => {
    const toggled = vi.fn();
    const c = new PaletteCollapse(win, { store: { key: "k", storage }, toggled });
    button().click();
    expect(c.isCollapsed()).toBe(true);
    expect(win.classList.contains(PALETTE_COLLAPSED_CLASS)).toBe(true);
    expect(button().getAttribute("aria-label")).toBe("Show the Tools");
    expect(button().textContent?.trim()).toBe("▸");
    expect(store.get("k")).toBe("collapsed");
    button().click();
    expect(store.get("k")).toBe("open");
    expect(toggled.mock.calls).toEqual([[true], [false]]);
    expect(win.querySelectorAll(`#${PALETTE_COLLAPSE_BUTTON_ID}`)).toHaveLength(1);
  });

  it("starts folded when the player left it folded, and open when the storage throws", () => {
    store.set("k", "collapsed");
    new PaletteCollapse(win, { store: { key: "k", storage } });
    expect(win.classList.contains(PALETTE_COLLAPSED_CLASS)).toBe(true);
    const broken = {
      getItem: (): string | null => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const other = document.createElement("aside");
    const c = new PaletteCollapse(other, { store: { key: "k", storage: broken } });
    expect(c.isCollapsed()).toBe(false);
    c.toggle();
    expect(c.isCollapsed()).toBe(true);
  });

  it("opens around a pointed-at tool on the desktop layout only", () => {
    store.set("k", "collapsed");
    const c = new PaletteCollapse(win, { store: { key: "k", storage } });
    const tool = document.createElement("div");
    win.querySelector(".palette-scroll")!.append(tool);
    desktop = false;
    c.openAround(tool);
    expect(c.isCollapsed()).toBe(true);
    desktop = true;
    c.openAround(document.body);
    expect(c.isCollapsed()).toBe(true);
    c.openAround(tool);
    expect(c.isCollapsed()).toBe(false);
  });
});
