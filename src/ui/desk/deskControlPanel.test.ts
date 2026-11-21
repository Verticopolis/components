import { describe, expect, it, vi } from "vitest";
import { CONTROL_PANEL_ID, ControlPanel, type ControlItem } from "./deskControlPanel";

const ITEMS: ControlItem[] = [
  { icon: "display", label: "Display", hint: "Screen saver" },
  { icon: "sounds", label: "Sounds", hint: "Sound on or off" },
  { icon: "settings", label: "Settings", hint: "Game settings" },
];

function panel(closed?: () => void) {
  const picked = vi.fn();
  const p = new ControlPanel(document, { items: ITEMS, closeLabel: "Close Control Panel", picked, closed });
  document.body.append(p.root);
  return { p, picked };
}

const icons = (p: ControlPanel) => [...p.root.querySelectorAll<HTMLButtonElement>(".desk-control-icon")];

describe("the Control Panel", () => {
  it("draws closed, titled, with each icon in order and the object count", () => {
    const { p } = panel();
    expect(p.root.id).toBe(CONTROL_PANEL_ID);
    expect(p.isOpen()).toBe(false);
    expect(p.root.querySelector(".desk-title-text")!.textContent).toBe("Control Panel");
    expect(p.root.querySelector(".desk-title-icon")!.getAttribute("src")).toBe("./favicon.png");
    expect(icons(p).map((b) => [b.dataset.control, b.title, b.textContent!.trim()])).toEqual([
      ["display", "Screen saver", "Display"],
      ["sounds", "Sound on or off", "Sounds"],
      ["settings", "Game settings", "Settings"],
    ]);
    expect(icons(p)[0]!.querySelector("svg rect")).not.toBeNull();
    expect(p.root.querySelector(".desk-control-status")!.textContent).toBe("3 object(s)");
    p.root.remove();
  });

  it("takes a title and a title-bar icon of the page's own", () => {
    const p = new ControlPanel(document, {
      items: ITEMS,
      closeLabel: "Close",
      picked: vi.fn(),
      title: "Settings",
      icon: "/icon.png",
    });
    expect(p.root.querySelector(".desk-title-text")!.textContent).toBe("Settings");
    expect(p.root.querySelector(".desk-title-icon")!.getAttribute("src")).toBe("/icon.png");
    expect(p.root.querySelector(".desk-control-icons")!.getAttribute("aria-label")).toBe("Settings");
  });

  it("hands each press to the page and runs nothing of its own", () => {
    const { p, picked } = panel();
    icons(p)[1]!.click();
    expect(picked).toHaveBeenCalledExactlyOnceWith("sounds");
    p.root.remove();
  });

  it("opens, and closes from its ✕, telling the page", () => {
    const closed = vi.fn();
    const { p } = panel(closed);
    p.open();
    expect(p.isOpen()).toBe(true);
    p.root.querySelector<HTMLButtonElement>('[aria-label="Close Control Panel"]')!.click();
    expect([p.isOpen(), closed.mock.calls.length]).toEqual([false, 1]);
    p.root.remove();
  });

  it("shows a label the page sets under its icon, and keeps the button", () => {
    const { p } = panel();
    const sounds = icons(p)[1]!;
    p.setLabel("sounds", "Sounds: Off");
    expect(icons(p)[1]).toBe(sounds);
    expect(sounds.textContent!.trim()).toBe("Sounds: Off");
    p.setLabel("sounds", "Sounds: On");
    expect(sounds.textContent!.trim()).toBe("Sounds: On");
    p.root.remove();
  });
});
