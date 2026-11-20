import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ToolPalette,
  type PaletteGroup,
  type PaletteTool,
  type PaletteView,
  type ToolPaletteOptions,
} from "./toolPalette";

const tool = (key: string, extra: Partial<PaletteTool> = {}): PaletteTool => ({
  key,
  attr: "kind",
  name: key[0].toUpperCase() + key.slice(1),
  cost: "$1K",
  color: "#888",
  description: `What ${key} does.`,
  label: `${key}, $1K`,
  ...extra,
});

const PINNED: PaletteTool[] = [
  tool("inspect", { attr: "tool", cost: undefined, icon: "inspect" }),
  tool("bulldoze", { attr: "tool", cost: undefined, icon: "bulldoze" }),
];

function groups(stars = 1): PaletteGroup[] {
  return [
    {
      title: "Structure",
      tools: [tool("floor"), tool("lobby"), tool("bridge", { attr: "tool", modern: true, locked: stars < 4 })],
    },
    { title: "Commercial", tools: [tool("office"), tool("shop", { locked: stars < 2 })] },
    { title: "Leisure", tools: [tool("cinema", { locked: stars < 3 })] },
  ];
}

const view = (stars = 1, active: string | null = "inspect"): PaletteView => ({
  pinned: PINNED,
  groups: groups(stars),
  active,
});

class FakeMedia extends EventTarget {
  constructor(public matches: boolean) {
    super();
  }
  flip(matches: boolean): void {
    this.matches = matches;
    this.dispatchEvent(new Event("change"));
  }
}

describe("ToolPalette", () => {
  let list: HTMLElement;
  let tabs: HTMLElement;
  let pick: ReturnType<typeof vi.fn<(t: PaletteTool) => void>>;
  let hint: ReturnType<typeof vi.fn<(t: PaletteTool | null) => void>>;
  let folded: ReturnType<typeof vi.fn<() => void>>;
  let store: Map<string, string>;
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };

  const make = (opts: Partial<ToolPaletteOptions> = {}) =>
    new ToolPalette({ list, tabs, pick, hint, folded, foldStore: { key: "folds", storage }, ...opts });
  const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;
  const item = (key: string) => $(`.pal-item[data-kind="${key}"], .pal-item[data-tool="${key}"]`);
  const key = (el: HTMLElement, k: string, type: "keydown" | "keyup" = "keydown") =>
    el.dispatchEvent(
      new KeyboardEvent(type, { key: k, code: k === " " ? "Space" : "", bubbles: true, cancelable: true }),
    );

  beforeEach(() => {
    list = document.createElement("div");
    list.className = "palette-scroll";
    tabs = document.createElement("div");
    tabs.className = "palette-tabs";
    document.body.replaceChildren(tabs, list);
    pick = vi.fn();
    hint = vi.fn();
    folded = vi.fn();
    store = new Map();
  });

  it("draws the pinned tools and each category with the attributes the stylesheets name", () => {
    make().update(view());
    expect(item("inspect").dataset.tool).toBe("inspect");
    expect(item("inspect").querySelector("svg")?.dataset.icon).toBe("inspect");
    expect(item("office").dataset.group).toBe("Commercial");
    expect(item("office").getAttribute("aria-label")).toBe("office, $1K");
    expect(item("office").getAttribute("aria-describedby")).toBe("pal-desc-office");
    expect($("#pal-desc-office").textContent).toBe("What office does.");
    expect(item("office").querySelector(".pal-cost")?.textContent).toBe("$1K");
    expect(item("inspect").querySelector(".pal-cost")).toBeNull();
    expect(item("inspect").classList.contains("active")).toBe(true);
    expect($("#pal-panel-commercial").dataset.group).toBe("Commercial");
  });

  it("hides a locked tool, a category with none unlocked and its tab, and the Modern band until one unlocks", () => {
    const p = make();
    p.update(view(1));
    expect(item("shop").classList.contains("locked")).toBe(true);
    expect($("#pal-panel-leisure").hidden).toBe(true);
    expect($("#pal-tab-leisure").hidden).toBe(true);
    expect($('.pal-sub[data-sub-group="Structure"]').hidden).toBe(true);
    p.update(view(4));
    expect($("#pal-panel-leisure").hidden).toBe(false);
    expect($('.pal-sub[data-sub-group="Structure"]').hidden).toBe(false);
    expect(item("bridge").classList.contains("pal-mod")).toBe(true);
  });

  it("answers whether a tool came into view or left it", () => {
    const p = make();
    expect(p.update(view(1))).toBe(true);
    expect(p.update(view(1, "office"))).toBe(false);
    expect(p.update(view(2))).toBe(true);
  });

  it("dims a tool the funds cannot reach, and never a locked one", () => {
    const p = make();
    const poor = (g: PaletteGroup[]) =>
      g.map((x) => ({ ...x, tools: x.tools.map((t) => ({ ...t, unaffordable: true })) }));
    p.update({ ...view(1), groups: poor(groups(1)) });
    expect(item("office").classList.contains("unaffordable")).toBe(true);
    expect(item("shop").classList.contains("unaffordable")).toBe(false);
  });

  it("keeps each tool's element, a class the game added and the focus across updates", () => {
    const p = make();
    p.update(view(1));
    const office = item("office");
    office.classList.add("tt-pulse");
    office.focus();
    p.update(view(3, "office"));
    expect(item("office")).toBe(office);
    expect(office.classList.contains("tt-pulse")).toBe(true);
    expect(office.classList.contains("active")).toBe(true);
    expect(document.activeElement).toBe(office);
  });

  it("picks a tool on a click, on Enter, and on a Space release that began on it", () => {
    make().update(view(2));
    item("shop").click();
    key(item("office"), "Enter");
    key(item("lobby"), " ");
    expect(pick).toHaveBeenCalledTimes(2);
    key(item("lobby"), " ", "keyup");
    expect(pick.mock.calls.map(([t]) => t.key)).toEqual(["shop", "office", "lobby"]);
  });

  it("drops a Space press the game canceled, as a pan, or one released elsewhere", () => {
    make().update(view(2));
    key(item("lobby"), " ");
    const up = new KeyboardEvent("keyup", { key: " ", code: "Space", bubbles: true, cancelable: true });
    up.preventDefault();
    item("lobby").dispatchEvent(up);
    key(item("floor"), " ");
    item("floor").dispatchEvent(new FocusEvent("blur"));
    key(item("floor"), " ", "keyup");
    expect(pick).not.toHaveBeenCalled();
  });

  it("hints a tool while the mouse or the focus rests on it, and not for a finger", () => {
    make().update(view(2));
    item("office").dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
    item("office").dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
    item("shop").dispatchEvent(new PointerEvent("pointerenter", { pointerType: "touch" }));
    item("lobby").dispatchEvent(new FocusEvent("focus"));
    expect(hint.mock.calls.map(([t]) => t?.key ?? null)).toEqual(["office", null, "lobby"]);
  });

  it("folds a category from its header, keeps the fold, and calls folded to refit", () => {
    make().update(view(2));
    const header = $('#pal-panel-commercial > .pal-group-title[data-group="Commercial"]');
    expect(header.getAttribute("aria-expanded")).toBe("true");
    header.click();
    expect($("#pal-panel-commercial").classList.contains("pal-folded")).toBe(true);
    expect(header.getAttribute("aria-expanded")).toBe("false");
    expect(store.get("folds")).toBe('["Commercial"]');
    expect(folded).toHaveBeenCalledTimes(1);
    key(header, "Enter");
    expect($("#pal-panel-commercial").classList.contains("pal-folded")).toBe(false);
    expect(store.get("folds")).toBe("[]");
  });

  it("starts with the folds kept, and with none when the storage throws", () => {
    store.set("folds", '["Structure"]');
    make().update(view());
    expect($("#pal-panel-structure").classList.contains("pal-folded")).toBe(true);
    list = document.createElement("div");
    document.body.replaceChildren(list);
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const p = new ToolPalette({ list, pick, foldStore: { key: "folds", storage: broken } });
    p.update(view());
    p.toggleFold("Structure");
    expect(list.querySelector("#pal-panel-structure")?.classList.contains("pal-folded")).toBe(true);
  });

  it("opens the first shown category's tab, and another on a click", () => {
    const p = make();
    p.update(view(2));
    expect(p.openGroup()).toBe("Structure");
    expect($("#pal-tab-structure").getAttribute("aria-selected")).toBe("true");
    expect($("#pal-tab-structure").tabIndex).toBe(0);
    expect($("#pal-panel-structure").classList.contains("tab-active")).toBe(true);
    $("#pal-tab-commercial").click();
    expect(p.openGroup()).toBe("Commercial");
    expect($("#pal-tab-structure").tabIndex).toBe(-1);
    expect($("#pal-panel-commercial").classList.contains("tab-active")).toBe(true);
  });

  it("steps the tabs with the arrow keys, Home and End, over the shown ones only", () => {
    make().update(view(2));
    const tab = (t: string) => $(`#pal-tab-${t}`);
    key(tab("structure"), "ArrowLeft");
    expect(document.activeElement).toBe(tab("commercial"));
    key(tab("commercial"), "ArrowRight");
    expect(document.activeElement).toBe(tab("structure"));
    key(tab("structure"), "End");
    expect(tab("commercial").getAttribute("aria-selected")).toBe("true");
    key(tab("commercial"), "Home");
    expect(tab("structure").getAttribute("aria-selected")).toBe("true");
  });

  it("pips a tab whose category gained tools, unless it is open, until it opens", () => {
    const p = make();
    p.update(view(1));
    expect(document.querySelectorAll(".pal-tab.has-new")).toHaveLength(0);
    p.update(view(3));
    expect($("#pal-tab-commercial").classList.contains("has-new")).toBe(true);
    expect($("#pal-tab-leisure").classList.contains("has-new")).toBe(true);
    p.openTab("Leisure");
    expect($("#pal-tab-leisure").classList.contains("has-new")).toBe(false);
    p.update(view(4));
    expect($("#pal-tab-structure").classList.contains("has-new")).toBe(true);
  });

  it("moves to a shown tab when the open one empties", () => {
    const p = make();
    p.update(view(3));
    p.openTab("Leisure");
    p.update(view(1));
    expect(p.openGroup()).toBe("Structure");
  });

  it("makes the sections tab panels only where the tabs show", () => {
    const media = new FakeMedia(false);
    const p = make({ tabMedia: media as unknown as MediaQueryList });
    p.update(view(2));
    expect($("#pal-panel-structure").hasAttribute("role")).toBe(false);
    media.flip(true);
    expect($("#pal-panel-structure").getAttribute("role")).toBe("tabpanel");
    expect($("#pal-panel-structure").getAttribute("aria-labelledby")).toBe("pal-tab-structure");
    p.dispose();
    media.flip(false);
    expect($("#pal-panel-structure").getAttribute("role")).toBe("tabpanel");
  });

  it("opens no tab on a page without a tab bar", () => {
    const p = make({ tabs: null });
    p.update(view(2));
    expect(p.openGroup()).toBeNull();
    expect(document.querySelectorAll(".tab-active")).toHaveLength(0);
  });
});
