import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { changesFoldedRows, fitPalette, PALETTE_FIT, PaletteFit } from "./paletteFit";

/** A window whose list is `heights[classes]` tall in a 400 px window. */
function windowOf(heights: Record<string, number>): HTMLElement {
  const win = document.createElement("aside");
  win.id = "palette";
  Object.defineProperty(win, "clientHeight", { configurable: true, get: () => 400 });
  Object.defineProperty(win, "scrollHeight", {
    configurable: true,
    get: () => heights[[...win.classList].sort().join(" ")] ?? 1000,
  });
  document.body.replaceChildren(win);
  return win;
}

describe("fitPalette", () => {
  it("keeps the normal rows when they fit", () => {
    const win = windowOf({ "": 380 });
    expect(fitPalette(win, true)).toEqual([]);
    expect(win.className).toBe("");
  });

  it("tries compact rows, then two columns, then both, and keeps the first that fits", () => {
    expect(fitPalette(windowOf({ "": 500, [PALETTE_FIT.compact]: 390 }), true)).toEqual([PALETTE_FIT.compact]);
    expect(fitPalette(windowOf({ "": 500, [PALETTE_FIT.compact]: 450, [PALETTE_FIT.columns]: 300 }), true)).toEqual([
      PALETTE_FIT.columns,
    ]);
  });

  it("stays on the shortest layout when none fits", () => {
    const win = windowOf({});
    expect(fitPalette(win, true)).toEqual([PALETTE_FIT.columns, PALETTE_FIT.compact]);
    expect(win.classList.contains(PALETTE_FIT.columns)).toBe(true);
  });

  it("clears the fit off the desktop layout", () => {
    const win = windowOf({});
    win.classList.add(PALETTE_FIT.compact, "win");
    expect(fitPalette(win, false)).toEqual([]);
    expect(win.className).toBe("win");
  });
});

describe("changesFoldedRows", () => {
  const record = (target: Node, oldValue: string) => ({ target, oldValue }) as unknown as MutationRecord;
  let item: HTMLElement;
  beforeEach(() => {
    const section = document.createElement("section");
    section.className = "pal-group pal-folded";
    item = document.createElement("div");
    item.className = "pal-item";
    section.append(item);
    document.body.replaceChildren(section);
  });

  it("counts a tool under a folded category that was picked or pointed at, or let go", () => {
    item.classList.add("active");
    expect(changesFoldedRows(record(item, "pal-item"))).toBe(true);
    item.classList.remove("active");
    expect(changesFoldedRows(record(item, "pal-item active"))).toBe(true);
    item.classList.add("tt-pulse");
    expect(changesFoldedRows(record(item, "pal-item"))).toBe(true);
  });

  it("ignores a change that keeps it shown or hidden, an open category, and anything not a tool", () => {
    item.classList.add("unaffordable");
    expect(changesFoldedRows(record(item, "pal-item"))).toBe(false);
    item.closest("section")!.classList.remove("pal-folded");
    item.classList.add("active");
    expect(changesFoldedRows(record(item, "pal-item"))).toBe(false);
    expect(changesFoldedRows(record(document.body, ""))).toBe(false);
  });
});

describe("PaletteFit", () => {
  let matches = true;
  let listeners: (() => void)[] = [];
  beforeEach(() => {
    matches = true;
    listeners = [];
    vi.spyOn(window, "matchMedia").mockImplementation(
      () =>
        ({
          get matches() {
            return matches;
          },
          addEventListener: (_: string, f: () => void) => listeners.push(f),
          removeEventListener: (_: string, f: () => void) => (listeners = listeners.filter((g) => g !== f)),
        }) as unknown as MediaQueryList,
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("fits at once, on a refit, and when the viewport crosses the desktop layout", () => {
    const heights: Record<string, number> = { "": 500 };
    const win = windowOf(heights);
    const fit = new PaletteFit(win);
    expect(win.classList.contains(PALETTE_FIT.columns)).toBe(true);
    heights[""] = 300;
    expect(fit.refit()).toEqual([]);
    win.classList.add(PALETTE_FIT.compact);
    matches = false;
    for (const f of listeners) f();
    expect(win.classList.contains(PALETTE_FIT.compact)).toBe(false);
    fit.dispose();
    expect(listeners).toHaveLength(0);
  });

  it("refits when a tool under a folded category is picked", async () => {
    const heights: Record<string, number> = { "": 300 };
    const win = windowOf(heights);
    const section = document.createElement("section");
    section.className = "pal-group pal-folded";
    const item = document.createElement("div");
    item.className = "pal-item";
    section.append(item);
    win.append(section);
    const fit = new PaletteFit(win);
    expect(win.className).toBe("");
    heights[""] = 500;
    heights[PALETTE_FIT.compact] = 390;
    item.classList.add("active");
    await new Promise((r) => setTimeout(r, 0));
    expect(win.classList.contains(PALETTE_FIT.compact)).toBe(true);
    fit.dispose();
  });

  it("skips the fonts-ready refit once disposed", async () => {
    let ready!: () => void;
    const fonts = { ready: new Promise<void>((r) => (ready = r)) };
    const had = Object.getOwnPropertyDescriptor(document, "fonts");
    Object.defineProperty(document, "fonts", { configurable: true, value: fonts });
    try {
      const heights: Record<string, number> = { "": 300 };
      const win = windowOf(heights);
      const fit = new PaletteFit(win);
      fit.dispose();
      heights[""] = 500;
      ready();
      await fonts.ready;
      await Promise.resolve();
      expect(win.className).toBe("");
    } finally {
      if (had) Object.defineProperty(document, "fonts", had);
      else delete (document as { fonts?: unknown }).fonts;
    }
  });
});
