import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeskTaskbar, shownItems, trayClock, type StartItem, type TaskbarOptions } from "./deskTaskbar";

describe("trayClock", () => {
  it("reads the time as the 1995 tray did, with a 12-hour clock", () => {
    expect(trayClock(new Date(2026, 10, 15, 16, 34))).toBe("4:34 PM");
    expect(trayClock(new Date(2026, 10, 15, 0, 5))).toBe("12:05 AM");
    expect(trayClock(new Date(2026, 10, 15, 12, 0))).toBe("12:00 PM");
    expect(trayClock(new Date(2026, 10, 15, 9, 7))).toBe("9:07 AM");
  });
});

const ITEMS: (StartItem | null)[] = [
  { id: "new", label: "New…" },
  { id: "open", label: "Open…" },
  null,
  { id: "manual", label: "Player's Manual" },
  { id: "control", label: "Control Panel…" },
  null,
  { id: "close", label: "Close Verticopolis" },
];

describe("shownItems", () => {
  it("keeps every item and separator when all show", () => {
    expect(shownItems(ITEMS)).toEqual(ITEMS);
  });

  it("leaves out hidden items and a separator with nothing shown after it", () => {
    const shown = shownItems(ITEMS, (id) => id !== "close" && id !== "new");
    expect(shown.map((i) => i?.id ?? "|")).toEqual(["open", "|", "manual", "control"]);
    expect(shownItems(ITEMS, (id) => id === "manual").map((i) => i?.id ?? "|")).toEqual(["manual"]);
  });
});

describe("DeskTaskbar", () => {
  let opts: TaskbarOptions & {
    task: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    controlPanel: ReturnType<typeof vi.fn>;
    sound: ReturnType<typeof vi.fn>;
    tray: ReturnType<typeof vi.fn>;
    opened: ReturnType<typeof vi.fn>;
  };
  let bar: DeskTaskbar;

  function make(over: Partial<TaskbarOptions> = {}): DeskTaskbar {
    opts = {
      items: ITEMS,
      task: vi.fn(),
      start: vi.fn(),
      controlPanel: vi.fn(),
      sound: vi.fn(),
      tray: vi.fn(),
      opened: vi.fn(),
      ...over,
    } as typeof opts;
    bar = new DeskTaskbar(document, opts);
    document.body.appendChild(bar.root);
    bar.start();
    return bar;
  }

  const menu = () => document.getElementById("desk-start-menu")!;
  const startButton = () => document.querySelector<HTMLElement>(".desk-start")!;
  const items = () => [...menu().querySelectorAll<HTMLElement>(".mb-item")];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 15, 16, 34, 30));
    document.body.innerHTML = "";
  });

  afterEach(() => {
    bar.stop();
    vi.useRealTimers();
  });

  it("is a labeled toolbar with the Verticopolis button, its menu shut, and the tray", () => {
    make({ className: "desk-taskbar-title", icon: "/app/icon.png" });
    expect(bar.root.getAttribute("role")).toBe("toolbar");
    expect(bar.root.getAttribute("aria-label")).toBe("Taskbar");
    expect(bar.root.className).toBe("desk-taskbar desk-taskbar-title");
    expect(startButton().textContent!.trim()).toBe("Verticopolis");
    expect(startButton().getAttribute("aria-controls")).toBe("desk-start-menu");
    expect(startButton().querySelector("img")!.getAttribute("src")).toBe("/app/icon.png");
    expect(menu().hidden).toBe(true);
    expect(document.querySelector(".desk-tray-display")).not.toBeNull();
    expect(document.querySelector(".desk-tray-sound")).not.toBeNull();
  });

  it("leaves the monitor and the speaker out without their handlers", () => {
    make({ controlPanel: undefined, sound: undefined });
    expect(document.querySelector(".desk-tray-display")).toBeNull();
    expect(document.querySelector(".desk-tray-sound")).toBeNull();
    expect(document.querySelector(".desk-tray-clock")).not.toBeNull();
  });

  it("opens the menu from its button with the items that show, focusing the first, and closes it on a second press", () => {
    make({ shown: (id) => id !== "close" });
    startButton().click();
    expect(menu().hidden).toBe(false);
    expect(startButton().getAttribute("aria-expanded")).toBe("true");
    expect(startButton().classList.contains("on")).toBe(true);
    expect(items().map((b) => b.textContent)).toEqual(["New…", "Open…", "Player's Manual", "Control Panel…"]);
    expect(menu().querySelectorAll("hr.mb-sep")).toHaveLength(1);
    expect(document.activeElement).toBe(items()[0]);
    expect(opts.opened).toHaveBeenCalledOnce();
    startButton().click();
    expect(menu().hidden).toBe(true);
    expect(startButton().getAttribute("aria-expanded")).toBe("false");
  });

  it("asks which items show each time the menu opens", () => {
    let hide = false;
    make({ shown: (id) => !(hide && id === "new") });
    startButton().click();
    expect(items()).toHaveLength(5);
    startButton().click();
    hide = true;
    startButton().click();
    expect(items().map((b) => b.dataset.item)).toEqual(["open", "manual", "control", "close"]);
  });

  it("moves through the menu with the arrow keys, wrapping at the ends", () => {
    make();
    startButton().click();
    const key = (k: string) => menu().dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    key("ArrowDown");
    expect(document.activeElement).toBe(items()[1]);
    key("ArrowUp");
    key("ArrowUp");
    expect(document.activeElement).toBe(items()[items().length - 1]);
  });

  it("closes the menu on Escape, back on its button, and on a press outside it", () => {
    make();
    startButton().click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(menu().hidden).toBe(true);
    expect(document.activeElement).toBe(startButton());
    startButton().click();
    items()[0].dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(menu().hidden).toBe(false);
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(menu().hidden).toBe(true);
  });

  it("runs a picked item by its id and closes the menu", () => {
    make();
    startButton().click();
    items()
      .find((b) => b.dataset.item === "manual")!
      .click();
    expect(opts.start).toHaveBeenCalledWith("manual");
    expect(menu().hidden).toBe(true);
  });

  it("opens the Control Panel and turns the sound from the tray, telling the analytics which", () => {
    make();
    document.querySelector<HTMLElement>(".desk-tray-display")!.click();
    expect(opts.controlPanel).toHaveBeenCalledOnce();
    expect(opts.tray).toHaveBeenLastCalledWith("display");
    document.querySelector<HTMLElement>(".desk-tray-sound")!.click();
    expect(opts.sound).toHaveBeenCalledOnce();
    expect(opts.tray).toHaveBeenLastCalledWith("sound");
  });

  it("shows the sound's state on the speaker", () => {
    make();
    const speaker = document.querySelector<HTMLElement>(".desk-tray-sound")!;
    expect(speaker.classList.contains("muted")).toBe(false);
    expect(speaker.getAttribute("aria-label")).toMatch(/on\./);
    bar.setSound(false);
    expect(speaker.classList.contains("muted")).toBe(true);
    expect(speaker.getAttribute("aria-label")).toMatch(/off\./);
  });

  it("shows a button per window, pressed in for the front one, and keeps its elements across renders", () => {
    make();
    const entries = [
      { id: "tower", label: "Tower One - Verticopolis", active: true, minimized: false },
      { id: "map", label: "Map", active: false, minimized: true },
    ];
    bar.render(entries);
    const buttons = [...document.querySelectorAll<HTMLElement>(".desk-task")];
    expect(buttons.map((b) => b.dataset.win)).toEqual(["tower", "map"]);
    expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    expect(buttons.map((b) => b.title)).toEqual(["Tower One - Verticopolis", "Map"]);
    bar.render(entries.map((e) => ({ ...e })));
    expect(document.querySelector(".desk-task")).toBe(buttons[0]);
    buttons[1].click();
    expect(opts.task).toHaveBeenCalledWith("map");
    bar.render([{ ...entries[0], active: false }]);
    expect(document.querySelectorAll(".desk-task")).toHaveLength(1);
    expect(document.querySelector(".desk-task")!.getAttribute("aria-pressed")).toBe("false");
  });

  it("opens a window's menu from a right-click and from Shift+F10 on its button", () => {
    const state = vi.fn(() => ({ restore: true, minimize: true, maximize: false, close: true }));
    make({ windowMenu: { state, run: vi.fn() } });
    bar.render([{ id: "map", label: "Map", active: false, minimized: false }]);
    const b = document.querySelector<HTMLElement>(".desk-task")!;
    const winMenu = () => document.querySelector<HTMLElement>(".desk-win-menu")!;
    expect(bar.root.contains(winMenu())).toBe(true);
    b.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
    expect(state).toHaveBeenCalledWith("map");
    expect(winMenu().hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(winMenu().hidden).toBe(true);
    b.dispatchEvent(new KeyboardEvent("keydown", { key: "F10", shiftKey: true, bubbles: true, cancelable: true }));
    expect(winMenu().hidden).toBe(false);
    expect(bar.openWindowMenu("map", 0, 0)).toBe(true);
  });

  it("has no window menu without its handlers", () => {
    make();
    expect(document.querySelector(".desk-win-menu")).toBeNull();
    expect(bar.openWindowMenu("map", 0, 0)).toBe(false);
  });

  it("keeps the clock on the minute, from the time it is given, and stops it when the desk goes", () => {
    make();
    const clock = document.querySelector(".desk-tray-clock")!;
    expect(clock.textContent).toBe("4:34 PM");
    vi.advanceTimersByTime(31_000);
    expect(clock.textContent).toBe("4:35 PM");
    bar.stop();
    vi.advanceTimersByTime(120_000);
    expect(clock.textContent).toBe("4:35 PM");
    bar.root.remove();
    make({ now: () => new Date(2026, 10, 15, 9, 15) });
    expect(document.querySelector(".desk-tray-clock")!.textContent).toBe("9:15 AM");
  });

  it("keeps one clock when started twice, which a single stop stops", () => {
    make();
    bar.start();
    const clock = document.querySelector(".desk-tray-clock")!;
    bar.stop();
    vi.advanceTimersByTime(120_000);
    expect(clock.textContent).toBe("4:34 PM");
    expect(vi.getTimerCount()).toBe(0);
  });
});
