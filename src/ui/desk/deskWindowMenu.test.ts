import { afterEach, describe, expect, it, vi } from "vitest";
import { WindowMenu, type WindowMenuHandlers, type WindowMenuState } from "./deskWindowMenu";

const ALL: WindowMenuState = { restore: true, minimize: true, maximize: true, close: true };

function mount(state: WindowMenuState | null = ALL) {
  const handlers = {
    state: vi.fn((_id: string) => state),
    run: vi.fn(),
    opened: vi.fn(),
  } satisfies WindowMenuHandlers;
  const menu = new WindowMenu(document, handlers);
  document.body.append(menu.root);
  const opener = document.createElement("button");
  document.body.append(opener);
  const item = (command: string) => menu.root.querySelector<HTMLButtonElement>(`[data-command="${command}"]`)!;
  const key = (k: string) =>
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  return { menu, handlers, opener, item, key };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("WindowMenu", () => {
  it("draws Restore, Minimize, Maximize, a line and Close, shut", () => {
    const { menu } = mount();
    const root = menu.root;
    expect(root.className).toBe("desk-win-menu");
    expect(root.getAttribute("role")).toBe("menu");
    expect(root.getAttribute("aria-label")).toBe("Window");
    expect(root.hidden).toBe(true);
    expect(menu.open).toBe(false);
    const rows = [...root.children].map((c) =>
      c.tagName === "HR"
        ? `hr.${c.className}`
        : `${c.getAttribute("role")}:${c.textContent}:${c.getAttribute("data-command")}`,
    );
    expect(rows).toEqual([
      "menuitem:Restore:restore",
      "menuitem:Minimize:minimize",
      "menuitem:Maximize:maximize",
      "hr.mb-sep",
      "menuitem:Close:close",
    ]);
    for (const b of root.querySelectorAll("button")) {
      expect(b.className).toBe("mb-item");
      expect(b.type).toBe("button");
    }
  });

  it("opens grayed by the window's state, focuses the first item that applies and says where it opened", () => {
    const { menu, handlers, item } = mount({ restore: false, minimize: true, maximize: false, close: true });
    expect(menu.show("tower", 10, 20, true, null)).toBe(true);
    expect(menu.open).toBe(true);
    expect([
      item("restore").disabled,
      item("minimize").disabled,
      item("maximize").disabled,
      item("close").disabled,
    ]).toEqual([true, false, true, false]);
    expect(document.activeElement).toBe(item("minimize"));
    expect(handlers.opened).toHaveBeenCalledWith("tower", "taskbar");
  });

  it("stays shut when the window has no state", () => {
    const { menu, handlers } = mount(null);
    expect(menu.show("gone", 0, 0, false, null)).toBe(false);
    expect(menu.open).toBe(false);
    expect(handlers.opened).not.toHaveBeenCalled();
  });

  it("a later opening redraws the grayed items on the same buttons", () => {
    let state: WindowMenuState = ALL;
    const handlers: WindowMenuHandlers = { state: () => state, run: vi.fn() };
    const menu = new WindowMenu(document, handlers);
    document.body.append(menu.root);
    menu.show("a", 0, 0, false, null);
    const close = menu.root.querySelector<HTMLButtonElement>('[data-command="close"]')!;
    expect(close.disabled).toBe(false);
    menu.close();
    state = { ...ALL, close: false };
    menu.show("a", 0, 0, false, null);
    expect(menu.root.querySelector('[data-command="close"]')).toBe(close);
    expect(close.disabled).toBe(true);
  });

  it("an item's click closes the menu, gives the focus back and runs its command", () => {
    const { menu, handlers, opener, item } = mount();
    menu.show("map", 0, 0, false, opener);
    expect(handlers.opened).toHaveBeenCalledWith("map", "title_bar");
    item("maximize").click();
    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(opener);
    expect(handlers.run).toHaveBeenCalledWith("map", "maximize");
  });

  it("the arrows move through the items that apply, and Escape closes it back to its opener", () => {
    const { menu, opener, item, key } = mount({ restore: true, minimize: false, maximize: true, close: true });
    menu.show("tower", 0, 0, false, opener);
    expect(document.activeElement).toBe(item("restore"));
    key("ArrowDown");
    expect(document.activeElement).toBe(item("maximize"));
    key("ArrowDown");
    expect(document.activeElement).toBe(item("close"));
    key("ArrowDown");
    expect(document.activeElement).toBe(item("restore"));
    key("ArrowUp");
    expect(document.activeElement).toBe(item("close"));
    key("Escape");
    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });
});
