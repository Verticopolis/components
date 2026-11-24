import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeskRect } from "./deskGeometry";
import { DeskManager, deskTaskResult, type DeskManagerOptions, type DeskSlot } from "./deskManager";
import { DESK_ACTIVE_CLASS, DESK_MINIMIZED_CLASS } from "./deskWindow";
import type { Store } from "./deskStore";

type Id = "tower" | "build" | "goals";
const ORDER: readonly Id[] = ["tower", "build", "goals"];
const PLACES: Record<Id, DeskRect> = {
  tower: { x: 200, y: 40, w: 500, h: 400 },
  build: { x: 8, y: 8, w: 180, h: 300 },
  goals: { x: 720, y: 8, w: 200, h: 150 },
};

/** jsdom lays nothing out: each window reports the place its styles give it. */
function laidOut(el: HTMLElement, w = 100, h = 100): HTMLElement {
  const px = (v: string, d: number) => (v.endsWith("px") ? Number.parseFloat(v) : d);
  Object.defineProperties(el, {
    offsetLeft: { get: () => px(el.style.left, 0) },
    offsetTop: { get: () => px(el.style.top, 0) },
    offsetWidth: { get: () => px(el.style.width, w) },
    offsetHeight: { get: () => px(el.style.height, h) },
  });
  return el;
}

/** A window the page draws with its own title bar. */
function win(id: string, hidden = false): HTMLElement {
  const el = laidOut(document.createElement("section"));
  el.id = id;
  el.className = "win";
  el.hidden = hidden;
  const bar = document.createElement("div");
  bar.className = "win-title";
  bar.textContent = id;
  el.appendChild(bar);
  return el;
}

function memoryStore(seed: Record<string, string> = {}): Store & { data: Record<string, string> } {
  const data = { ...seed };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

interface Rig {
  manager: DeskManager<Id>;
  desk: HTMLElement;
  els: Record<Id, HTMLElement>;
  refreshed: ReturnType<typeof vi.fn>;
  store: ReturnType<typeof memoryStore>;
  /** Each window's label; a test renames one by writing here. */
  names: Record<Id, string>;
}

/** Every rig a test made, taken off the window after it. */
const rigs: Rig[] = [];

function rig(
  over: Partial<DeskManagerOptions<Id>> = {},
  seed: Record<string, string> = {},
  goalsHidden = false,
  buildMax = false,
): Rig {
  const desk = document.createElement("div");
  Object.defineProperties(desk, {
    clientWidth: { value: 1000, configurable: true },
    clientHeight: { value: 600, configurable: true },
  });
  document.body.appendChild(desk);
  const els = { tower: win("tower"), build: win("build"), goals: win("goals", goalsHidden) };
  for (const el of Object.values(els)) desk.appendChild(el);
  const store = memoryStore(seed);
  const refreshed = vi.fn();
  const names: Record<Id, string> = { tower: "TOWER", build: "BUILD", goals: "GOALS" };
  const manager = new DeskManager<Id>({
    desk,
    order: ORDER,
    places: () => PLACES,
    memory: { store, layoutKey: "places", maxKey: "max" },
    refreshed,
    ...over,
  });
  const slot = (id: Id, rest: Partial<DeskSlot<Id>> = {}): DeskSlot<Id> => ({
    id,
    el: els[id],
    label: () => names[id],
    layer: "tool",
    limits: null,
    canMax: false,
    isOpen: () => !els[id].hidden,
    ...rest,
  });
  manager.add(slot("tower", { layer: "app", limits: { minW: 300, minH: 200 }, canMax: true }));
  manager.add(slot("build", { limits: { minW: 100, minH: 100 }, canMax: buildMax }));
  manager.add(
    slot("goals", { open: () => void (els.goals.hidden = false), close: () => void (els.goals.hidden = true) }),
  );
  const made = { manager, desk, els, refreshed, store, names };
  rigs.push(made);
  return made;
}

const lastEntries = (r: Rig) => r.refreshed.mock.lastCall![0] as { id: string; active: boolean; minimized: boolean }[];
const z = (el: HTMLElement) => Number(el.style.zIndex);

beforeEach(() => {
  document.body.innerHTML = "";
});
afterEach(() => {
  for (const r of rigs.splice(0)) r.manager.dispose();
  vi.restoreAllMocks();
});

describe("deskTaskResult", () => {
  it("brings a minimized window back, minimizes the front one, and fronts any other", () => {
    expect([deskTaskResult(true, false), deskTaskResult(true, true)]).toEqual(["restore", "restore"]);
    expect([deskTaskResult(false, true), deskTaskResult(false, false)]).toEqual(["min", "front"]);
  });
});

describe("DeskManager", () => {
  it("opens each window at the page's place, with the app window focused under the small ones", () => {
    const r = rig();
    r.manager.start();
    expect([r.els.build.style.left, r.els.build.style.top, r.els.build.style.height]).toEqual(["8px", "8px", "300px"]);
    expect(r.els.tower.style.width).toBe("500px");
    expect(r.manager.active?.spec.id).toBe("tower");
    expect(r.els.tower.classList.contains(DESK_ACTIVE_CLASS)).toBe(true);
    expect(z(r.els.tower)).toBeLessThan(z(r.els.build));
    expect(lastEntries(r)).toEqual([
      { id: "tower", label: "TOWER", active: true, minimized: false },
      { id: "build", label: "BUILD", active: false, minimized: false },
      { id: "goals", label: "GOALS", active: false, minimized: false },
    ]);
  });

  it("names a renamed window's title-bar buttons after its new label on refresh", () => {
    const r = rig();
    r.manager.start();
    const min = r.els.tower.querySelector<HTMLElement>(".desk-btn-min")!;
    expect(min.getAttribute("aria-label")).toBe("Minimize TOWER");
    r.names.tower = "HARMONY";
    r.manager.refresh();
    expect(min.getAttribute("aria-label")).toBe("Minimize HARMONY");
    expect(r.els.tower.querySelector(".desk-btn-max")!.getAttribute("aria-label")).toBe("Maximize HARMONY");
    expect(lastEntries(r)[0]).toEqual({ id: "tower", label: "HARMONY", active: true, minimized: false });
  });

  it("leaves a closed window off the taskbar", () => {
    const r = rig({}, {}, true);
    r.manager.start();
    expect(lastEntries(r).map((e) => e.id)).toEqual(["tower", "build"]);
  });

  it("opens at the saved places of the page's own ids, and maximizes the app window that was, unheard", () => {
    const changed = vi.fn();
    const r = rig({ changed }, { places: JSON.stringify({ build: { x: 30, y: 40, w: 150, h: 220 } }), max: "tower" });
    r.manager.start();
    expect([r.els.build.style.left, r.els.build.style.top]).toEqual(["30px", "40px"]);
    expect(r.manager.get("tower")!.maximized).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it("fits a place to the desk", () => {
    const r = rig({ places: () => ({ ...PLACES, goals: { x: 5000, y: 10, w: 200, h: 150 } }) });
    r.manager.start();
    expect(Number.parseFloat(r.els.goals.style.left)).toBeLessThanOrEqual(1000 - 100);
  });

  it("runs a taskbar press: front, then minimize, then bring back, and says which", () => {
    const tasked = vi.fn();
    const r = rig({ tasked });
    r.manager.start();
    r.manager.taskPressed("goals");
    expect(r.manager.active?.spec.id).toBe("goals");
    r.manager.taskPressed("goals");
    expect(r.els.goals.classList.contains(DESK_MINIMIZED_CLASS)).toBe(true);
    // The topmost window still showing takes the focus.
    expect(r.manager.active?.spec.id).toBe("build");
    r.manager.taskPressed("goals");
    expect(r.manager.get("goals")!.minimized).toBe(false);
    expect(r.manager.active?.spec.id).toBe("goals");
    expect(tasked.mock.calls).toEqual([
      ["goals", "front"],
      ["goals", "min"],
      ["goals", "restore"],
    ]);
  });

  it("stacks windows in the order they were pressed, and keeps a maximized app window under them", () => {
    const r = rig();
    r.manager.start();
    r.manager.taskPressed("tower");
    r.manager.taskPressed("build");
    r.manager.taskPressed("tower");
    expect(z(r.els.tower)).toBeGreaterThan(z(r.els.build));
    r.manager.get("tower")!.toggleMax();
    expect(z(r.els.tower)).toBe(0);
    expect(r.manager.active?.spec.id).toBe("tower");
  });

  it("keeps the places a move leaves, beside the ones already kept, and the maximize", () => {
    const r = rig({}, { places: JSON.stringify({ goals: { x: 1, y: 2, w: 3, h: 4 } }) });
    r.manager.start();
    r.els.build.style.left = "60px";
    r.manager.get("build")!.spec.changed("move");
    const kept = JSON.parse(r.store.data.places);
    expect(kept.build).toEqual({ x: 60, y: 8, w: 180, h: 300 });
    expect(kept.goals).toBeDefined();
    r.manager.get("tower")!.toggleMax();
    expect(r.store.data.max).toBe("tower");
    r.manager.get("tower")!.toggleMax();
    expect(r.store.data.max).toBe("");
  });

  it("keeps nothing without a memory, and a store that throws keeps nothing quietly", () => {
    const bad: Store = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("full");
      },
    };
    const r = rig({ memory: { store: bad, layoutKey: "places", maxKey: "max" } });
    expect(() => r.manager.start()).not.toThrow();
    expect(() => r.manager.get("build")!.spec.changed("move")).not.toThrow();
    const none = rig({ memory: undefined });
    none.manager.start();
    none.manager.get("build")!.spec.changed("move");
    expect(none.store.data).toEqual({});
  });

  it("steps small windows below a maximized app window's menu bar, and back on restore unless moved", () => {
    const bar = document.createElement("div");
    vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({ bottom: 50 } as DOMRect);
    const r = rig({ chrome: (id) => (id === "tower" ? bar : null) });
    vi.spyOn(r.desk, "getBoundingClientRect").mockReturnValue({ top: 10 } as DOMRect);
    r.manager.start();
    r.manager.get("tower")!.toggleMax();
    expect(r.els.build.style.top).toBe("42px");
    expect(r.els.goals.style.top).toBe("42px");
    r.els.goals.style.left = "500px";
    r.manager.get("tower")!.toggleMax();
    expect(r.els.build.style.top).toBe("8px");
    expect(r.els.goals.style.top).toBe("42px");
  });

  it("leaves a maximized small window full size when the app window maximizes over it", () => {
    const bar = document.createElement("div");
    vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({ bottom: 50 } as DOMRect);
    const r = rig({ chrome: (id) => (id === "tower" ? bar : null) }, {}, false, true);
    vi.spyOn(r.desk, "getBoundingClientRect").mockReturnValue({ top: 10 } as DOMRect);
    r.manager.start();
    const build = r.manager.get("build")!;
    build.toggleMax();
    r.manager.get("tower")!.toggleMax();
    expect([r.els.build.style.top, r.els.build.style.width, r.els.build.style.height]).toEqual(["0px", "100%", "100%"]);
    r.manager.get("tower")!.toggleMax();
    build.toggleMax();
    expect(r.els.build.style.top).toBe("8px");
  });

  it("brings up a window the page opens its own way, and moves the focus off one it closes", async () => {
    const r = rig({}, {}, true);
    r.manager.start();
    r.els.goals.hidden = false;
    await Promise.resolve();
    expect(r.manager.active?.spec.id).toBe("goals");
    expect(lastEntries(r).map((e) => e.id)).toContain("goals");
    r.els.goals.hidden = true;
    await Promise.resolve();
    expect(r.manager.active?.spec.id).not.toBe("goals");
    expect(lastEntries(r).map((e) => e.id)).not.toContain("goals");
  });

  it("hears the close of a window the page opened between add and start", async () => {
    const r = rig({}, {}, true);
    r.els.goals.hidden = false;
    r.manager.start();
    r.manager.taskPressed("goals");
    expect(r.manager.active?.spec.id).toBe("goals");
    r.els.goals.hidden = true;
    await Promise.resolve();
    expect(r.manager.active?.spec.id).not.toBe("goals");
    expect(lastEntries(r).map((e) => e.id)).not.toContain("goals");
  });

  it("hears the page open and close a window added after start", async () => {
    const r = rig();
    r.manager.start();
    await Promise.resolve();
    const late = win("late", true);
    r.desk.appendChild(late);
    const lateId = "late" as Id;
    r.manager.add({
      id: lateId,
      el: late,
      label: () => "LATE",
      layer: "tool",
      limits: null,
      canMax: false,
      isOpen: () => !late.hidden,
    });
    late.hidden = false;
    await Promise.resolve();
    expect(r.manager.active?.spec.id).toBe(lateId);
    late.hidden = true;
    await Promise.resolve();
    expect(r.manager.active?.spec.id).not.toBe(lateId);
  });

  it("show opens a closed window the page's way and brings it up", () => {
    const r = rig({}, {}, true);
    r.manager.start();
    r.manager.show("goals");
    expect(r.els.goals.hidden).toBe(false);
    expect(r.manager.active?.spec.id).toBe("goals");
  });

  it("gives the taskbar the window menu's state and commands, and says what was picked", () => {
    const picked = vi.fn();
    const r = rig();
    r.manager.start();
    const menu = r.manager.windowMenu({ picked });
    expect(menu.state("tower")).toEqual({ restore: false, minimize: true, maximize: true, close: false });
    expect(menu.state("nope")).toBeNull();
    menu.run("build", "minimize");
    expect(r.manager.get("build")!.minimized).toBe(true);
    menu.run("build", "restore");
    expect(r.manager.active?.spec.id).toBe("build");
    menu.run("goals", "close");
    expect(r.els.goals.hidden).toBe(true);
    expect(picked.mock.calls).toEqual([
      ["build", "minimize"],
      ["build", "restore"],
      ["goals", "close"],
    ]);
  });

  it("finds the window whose title bar was pressed, but not from a button or the body", () => {
    const r = rig();
    r.manager.start();
    const title = r.els.build.querySelector(".win-title")!;
    expect(r.manager.titleBarOf(title)).toBe("build");
    expect(r.manager.titleBarOf(r.els.build)).toBeNull();
    expect(r.manager.titleBarOf(r.els.build.querySelector(".win-title button"))).toBeNull();
    expect(r.manager.titleBarOf(null)).toBeNull();
  });

  it("pulls windows back onto a desk that shrank, once per frame", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb));
    const r = rig();
    r.manager.start();
    Object.defineProperty(r.desk, "clientWidth", { value: 400 });
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    expect(frames).toHaveLength(1);
    frames[0](0);
    expect(Number.parseFloat(r.els.goals.style.left)).toBeLessThanOrEqual(300);
  });

  it("arranges every window back at its place and size", () => {
    const r = rig({}, { places: JSON.stringify({ build: { x: 300, y: 300, w: 150, h: 150 } }) });
    r.manager.start();
    r.manager.get("tower")!.toggleMax();
    r.manager.get("goals")!.minimize();
    r.manager.arrange();
    expect([r.els.build.style.left, r.els.build.style.height]).toEqual(["8px", "300px"]);
    expect(r.manager.get("tower")!.maximized).toBe(false);
    expect(r.manager.get("goals")!.minimized).toBe(false);
  });

  it("takes everything off on dispose and hears nothing after", async () => {
    const r = rig({}, {}, true);
    r.manager.start();
    r.manager.dispose();
    expect(r.els.build.classList.contains("desk-win")).toBe(false);
    expect(r.els.build.style.zIndex).toBe("");
    const calls = r.refreshed.mock.calls.length;
    r.els.goals.hidden = false;
    window.dispatchEvent(new Event("resize"));
    await Promise.resolve();
    expect(r.refreshed.mock.calls.length).toBe(calls);
    expect(r.manager.get("build")).toBeUndefined();
  });
});
