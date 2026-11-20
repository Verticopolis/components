import { afterEach, describe, expect, it, vi } from "vitest";
import { MenuBar, type MenuBarModel } from "./menuBar";

/** A File menu with a submenu between two items, the way the game lays out
 *  File > Open Recent, its lines numbered with the number underlined.
 *  `grayed` grays the submenu's title. */
function model(grayed = false): MenuBarModel {
  return {
    id: "menubar",
    label: "Test menu",
    menus: [
      {
        id: "t-file",
        popupId: "m-file",
        label: "File",
        mnemonic: 0,
        items: [
          { id: "i-open", label: "Open" },
          {
            kind: "submenu",
            id: "i-load",
            popupId: "m-load",
            label: "Load",
            disabled: grayed,
            items: [
              { id: "i-auto", label: "1Sky Mall", mnemonic: 0 },
              { id: "i-gone", label: "2Gone", mnemonic: 0, hidden: true },
              { id: "i-two", label: "3Old Tower", mnemonic: 0 },
            ],
          },
          { id: "i-save", label: "Save" },
        ],
      },
    ],
  };
}

function setup(grayed = false) {
  document.body.innerHTML = `<div id="host"></div>`;
  const bar = new MenuBar(document.getElementById("host")!, model(grayed));
  bars.push(bar);
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  const key = (el: Element, k: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  const press = (el: Element, pointerType: string) => {
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerType, bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  };
  const point = (el: Element) =>
    el.dispatchEvent(new PointerEvent("pointerover", { pointerType: "mouse", bubbles: true }));
  bar.open($("t-file") as HTMLButtonElement, false);
  return { bar, $, key, press, point };
}

const bars: MenuBar[] = [];
afterEach(() => {
  for (const bar of bars.splice(0)) bar.close(false);
  document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  document.body.innerHTML = "";
});

describe("a menu's submenu", () => {
  it("a mouse opens it by pointing at its title, its click keeps it open, and pointing at another item closes it", () => {
    const { bar, $, press, point } = setup();
    point($("i-load"));
    expect($("m-load").hidden).toBe(false);
    expect($("i-load").getAttribute("aria-expanded")).toBe("true");
    press($("i-load"), "mouse");
    expect($("m-load").hidden).toBe(false);
    expect(bar.current()).toBe($("t-file")); // the title is not a pick: File stays open
    point($("i-auto")); // inside the submenu: it stays
    expect($("m-load").hidden).toBe(false);
    point($("i-save"));
    expect($("m-load").hidden).toBe(true);
    expect($("i-load").getAttribute("aria-expanded")).toBe("false");
  });

  it("a tap on its title opens it and a second tap closes it", () => {
    const { $, press } = setup();
    press($("i-load"), "touch");
    expect($("m-load").hidden).toBe(false);
    press($("i-load"), "touch");
    expect($("m-load").hidden).toBe(true);
  });

  it("picking one of its items closes the whole menu", () => {
    const { bar, $, press } = setup();
    const picked = vi.fn();
    $("i-two").addEventListener("click", picked);
    press($("i-load"), "touch");
    press($("i-two"), "touch");
    expect(picked).toHaveBeenCalledOnce();
    expect(bar.current()).toBeNull();
    expect($("m-load").hidden).toBe(true);
    expect($("i-load").getAttribute("aria-expanded")).toBe("false");
  });

  it("the keys walk into it and back out, skipping a hidden item", () => {
    const { bar, $, key } = setup();
    $("i-load").focus();
    key($("i-load"), "ArrowRight");
    expect($("m-load").hidden).toBe(false);
    expect(document.activeElement).toBe($("i-auto"));
    key($("i-auto"), "ArrowDown");
    expect(document.activeElement).toBe($("i-two"));
    key($("i-two"), "ArrowLeft");
    expect($("m-load").hidden).toBe(true);
    expect(document.activeElement).toBe($("i-load"));
    key($("i-load"), "ArrowRight");
    key($("i-auto"), "Escape"); // closes the submenu only
    expect($("m-load").hidden).toBe(true);
    expect(bar.current()).toBe($("t-file"));
    key($("i-load"), "ArrowDown"); // the File menu's own items again
    expect(document.activeElement).toBe($("i-save"));
  });

  it("Enter on its title opens it with the focus on its first item", () => {
    const { $ } = setup();
    $("i-load").focus();
    $("i-load").dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
    expect($("m-load").hidden).toBe(false);
    expect(document.activeElement).toBe($("i-auto"));
  });

  it("closes with its menu", () => {
    const { bar, $, point } = setup();
    point($("i-load"));
    bar.close(false);
    expect($("m-load").hidden).toBe(true);
    bar.open($("t-file") as HTMLButtonElement, false);
    expect($("m-load").hidden).toBe(true);
  });

  it("a grayed title opens nothing, by pointing, a tap or the keys", () => {
    const { $, press, point, key } = setup(true);
    point($("i-load"));
    press($("i-load"), "touch");
    $("i-open").focus();
    key($("i-open"), "ArrowDown"); // the grayed title is skipped
    expect(document.activeElement).toBe($("i-save"));
    expect($("m-load").hidden).toBe(true);
    expect($("i-load").getAttribute("aria-expanded")).toBe("false");
  });

  it("an underlined number picks its line, and a hidden line's number picks nothing", () => {
    const { bar, $, key } = setup();
    const picked = vi.fn();
    $("i-two").addEventListener("click", (e) => picked((e as MouseEvent).detail));
    $("i-gone").addEventListener("click", picked);
    $("i-load").focus();
    key($("i-load"), "ArrowRight");
    key($("i-auto"), "2");
    expect(picked).not.toHaveBeenCalled();
    expect(bar.current()).toBe($("t-file"));
    key($("i-auto"), "3");
    expect(picked).toHaveBeenCalledExactlyOnceWith(0); // a keyboard pick
    expect(bar.current()).toBeNull();
  });

  it("a number pressed with Ctrl or in the menu above picks nothing", () => {
    const { bar, $ } = setup();
    const picked = vi.fn();
    $("i-auto").addEventListener("click", picked);
    $("i-open").focus();
    $("i-open").dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true }));
    $("i-load").focus();
    $("i-load").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    $("i-auto").dispatchEvent(
      new KeyboardEvent("keydown", { key: "1", ctrlKey: true, bubbles: true, cancelable: true }),
    );
    expect(picked).not.toHaveBeenCalled();
    expect(bar.current()).toBe($("t-file"));
  });
});
