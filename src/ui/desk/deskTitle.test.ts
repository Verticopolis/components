import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DESK_TITLE_CLASS, DESK_TITLE_POCKET_CLASS, DESK_TITLE_WINDOW, DeskTitle } from "./deskTitle";

function host(): HTMLElement {
  const el = document.createElement("div");
  el.id = "root";
  el.appendChild(document.createElement("p")).textContent = "the page's own";
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.body.className = "";
});
afterEach(() => {
  vi.useRealTimers();
});

describe("DeskTitle", () => {
  it("draws the window's title bar and the taskbar into the page's root, and takes them away", () => {
    const root = host();
    const task = vi.fn();
    const title = new DeskTitle({
      host: root,
      title: "Sample",
      icon: "/icon.png",
      taskbar: { items: [{ id: "new", label: "New…" }], task, start: vi.fn(), now: () => new Date(2026, 0, 1, 9, 15) },
    });
    expect(title.up).toBe(false);
    title.show();
    title.show();
    expect(title.up).toBe(true);
    expect(document.body.classList.contains(DESK_TITLE_CLASS)).toBe(true);
    expect(root.querySelectorAll(".desk-title-bar")).toHaveLength(1);
    const bar = root.querySelector(".desk-title-bar")!;
    expect([bar.getAttribute("aria-hidden"), bar.textContent]).toEqual(["true", "Sample"]);
    expect(bar.querySelector("img")!.getAttribute("src")).toBe("/icon.png");
    const taskbar = root.querySelector<HTMLElement>(".desk-taskbar.desk-taskbar-title")!;
    expect(taskbar).not.toBeNull();
    expect(title.taskbar!.root).toBe(taskbar);
    const button = [...taskbar.querySelectorAll<HTMLButtonElement>("button")].find((b) =>
      b.textContent?.includes("Sample"),
    )!;
    button.click();
    expect(task).toHaveBeenCalledWith(DESK_TITLE_WINDOW);

    title.hide();
    expect(title.up).toBe(false);
    expect(title.taskbar).toBeNull();
    expect(document.body.classList.contains(DESK_TITLE_CLASS)).toBe(false);
    expect(root.querySelector(".desk-title-bar, .desk-taskbar")).toBeNull();
    expect(root.querySelector("p")!.textContent).toBe("the page's own");
  });

  it("sits on the pocket desk when asked, switches as a tablet turns, and clears the pocket class when it goes", () => {
    const root = host();
    const title = new DeskTitle({ host: root, title: "Sample", taskbar: { items: [], task: vi.fn(), start: vi.fn() } });
    const body = document.body.classList;
    title.show(true);
    expect([body.contains(DESK_TITLE_CLASS), body.contains(DESK_TITLE_POCKET_CLASS)]).toEqual([true, true]);
    const bar = title.taskbar;
    title.show(false);
    expect([body.contains(DESK_TITLE_CLASS), body.contains(DESK_TITLE_POCKET_CLASS)]).toEqual([true, false]);
    expect(title.taskbar).toBe(bar);
    expect(root.querySelectorAll(".desk-title-bar")).toHaveLength(1);
    title.show(true);
    title.hide();
    expect([body.contains(DESK_TITLE_CLASS), body.contains(DESK_TITLE_POCKET_CLASS)]).toEqual([false, false]);
  });

  it("writes <body>'s class only when the desk changes, so a page watching it hears no echo", async () => {
    const root = host();
    const title = new DeskTitle({ host: root, title: "Sample", taskbar: { items: [], task: vi.fn(), start: vi.fn() } });
    title.show(true);
    const writes: MutationRecord[] = [];
    const watch = new MutationObserver((records) => writes.push(...records));
    watch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    title.show(true);
    await Promise.resolve();
    expect(writes).toHaveLength(0);
    title.show(false);
    await Promise.resolve();
    expect(writes).toHaveLength(1);
    watch.disconnect();
    title.hide();
  });

  it("can come back after it goes", () => {
    const root = host();
    const title = new DeskTitle({ host: root, title: "Sample", taskbar: { items: [], task: vi.fn(), start: vi.fn() } });
    title.show();
    title.hide();
    title.show();
    expect(root.querySelectorAll(".desk-title-bar")).toHaveLength(1);
    expect(root.querySelector(".desk-title-bar img")!.getAttribute("src")).toBe("./favicon.png");
    title.hide();
  });

  it("opens its Control Panel over the title screen from the page or the tray, under the Start menu, and closes it when it goes", () => {
    const root = host();
    const picked = vi.fn();
    const title = new DeskTitle({
      host: root,
      title: "Sample",
      taskbar: { items: [], task: vi.fn(), start: vi.fn() },
      controlPanel: {
        items: [{ icon: "display", label: "Display", hint: "Screen saver" }],
        closeLabel: "Close",
        picked,
      },
    });
    const panel = title.control!;
    title.openControl(); // off the desk: nothing to open it over
    expect(panel.isOpen()).toBe(false);
    title.show();
    // Drawn closed, before the taskbar so the Start menu opens over it.
    expect(panel.root.parentElement).toBe(root);
    expect(panel.root.compareDocumentPosition(title.taskbar!.root) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(panel.isOpen()).toBe(false);
    title.openControl();
    expect(panel.isOpen()).toBe(true);
    panel.root.querySelector<HTMLElement>('[data-control="display"]')!.click();
    expect(picked).toHaveBeenCalledWith("display");
    panel.close();
    root.querySelector<HTMLElement>(".desk-tray-display")!.click();
    expect(panel.isOpen()).toBe(true);
    title.hide();
    expect(root.contains(panel.root)).toBe(false);
    title.show();
    expect(panel.isOpen()).toBe(false);
  });

  it("has no Control Panel, and no tray monitor, without one", () => {
    const root = host();
    const title = new DeskTitle({ host: root, title: "Sample", taskbar: { items: [], task: vi.fn(), start: vi.fn() } });
    title.show();
    expect(title.control).toBeNull();
    expect(root.querySelector(".desk-tray-display, .desk-control")).toBeNull();
  });

  it("leaves the tray's monitor to the page when it hears it", () => {
    const root = host();
    const heard = vi.fn();
    const title = new DeskTitle({
      host: root,
      title: "Sample",
      taskbar: { items: [], task: vi.fn(), start: vi.fn(), controlPanel: heard },
      controlPanel: { items: [], closeLabel: "Close", picked: vi.fn() },
    });
    title.show();
    root.querySelector<HTMLElement>(".desk-tray-display")!.click();
    expect(heard).toHaveBeenCalledOnce();
    expect(title.control!.isOpen()).toBe(false);
  });
});
