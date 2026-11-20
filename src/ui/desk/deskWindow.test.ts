import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeskWindowSpec } from "./deskWindow";
import { MovableWindow, WITHIN_PARENT } from "../movableWindow";
import { DESK_ACTIVE_CLASS, DESK_MAXIMIZED_CLASS, DESK_MINIMIZED_CLASS, DeskWindow, buildFrame } from "./deskWindow";

const LIMITS = { minW: 300, minH: 200 };

function spec(el: HTMLElement, over: Partial<DeskWindowSpec> = {}): DeskWindowSpec {
  return {
    id: "tower",
    el,
    label: () => "Tower One",
    layer: "app",
    limits: null,
    canMax: false,
    isOpen: () => true,
    changed: vi.fn(),
    pressed: vi.fn(),
    ...over,
  };
}

/** A frame on a desk element, the way the desk builds the tower's. */
function frame(close?: () => void): HTMLElement {
  const desk = document.createElement("div");
  desk.id = "desk";
  document.body.appendChild(desk);
  const { root } = buildFrame(
    document,
    "desk-win-tower",
    "Tower One",
    close ? { label: "Close the tower", onClick: close } : undefined,
  );
  desk.appendChild(root);
  return root;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("buildFrame", () => {
  it("draws a window with a title bar named for it and an empty body", () => {
    const { root, body } = buildFrame(document, "desk-win-info", "Info");
    const title = root.querySelector<HTMLElement>(".win-title > .desk-title-text")!;
    expect(root.tagName).toBe("SECTION");
    expect(root.id).toBe("desk-win-info");
    expect(root.className).toBe("win win-closable desk-win desk-frame");
    expect(title.id).toBe("desk-win-info-title");
    expect(root.getAttribute("aria-labelledby")).toBe(title.id);
    expect(title.textContent).toBe("Info");
    const icon = root.querySelector<HTMLImageElement>(".win-title > img.desk-title-icon")!;
    expect([icon.getAttribute("src"), icon.alt, icon.width, icon.height]).toEqual(["./favicon.png", "", 16, 16]);
    expect(body.className).toBe("desk-body");
    expect(body.childElementCount).toBe(0);
    expect(root.querySelector(".desk-btn-close")).toBeNull();
  });

  it("draws the icon the page names", () => {
    const { root, setTitle } = buildFrame(document, "desk-win-info", "Info", undefined, "/app/icon.png");
    document.body.appendChild(root);
    setTitle("Info 2");
    expect(root.querySelector(".desk-title-icon")!.getAttribute("src")).toBe("/app/icon.png");
  });

  it("draws a labeled close button with its glyph that runs its click", () => {
    const onClick = vi.fn();
    const { root } = buildFrame(document, "desk-win-control", "Control Panel", {
      label: "Close Control Panel",
      onClick,
    });
    const b = root.querySelector<HTMLButtonElement>(".win-title > button.desk-btn-close")!;
    expect(b.className).toBe("btn xs desk-btn desk-btn-close");
    expect(b.type).toBe("button");
    expect(b.getAttribute("aria-label")).toBe("Close Control Panel");
    expect(b.title).toBe("Close Control Panel");
    expect(b.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(b.previousElementSibling!.className).toBe("desk-title-text");
    b.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renames the window in place once it is on the desk", () => {
    const { root, setTitle } = buildFrame(document, "desk-win-tower", "Tower One");
    document.body.appendChild(root);
    const title = root.querySelector(".desk-title-text")!;
    setTitle("Sky Mall");
    expect(root.querySelector(".desk-title-text")).toBe(title);
    expect(title.textContent).toBe("Sky Mall");
  });
});

describe("DeskWindow", () => {
  it("adds minimize before the window's close button, and maximize only where it is allowed", () => {
    const el = frame(() => {});
    new DeskWindow(spec(el, { canMax: true }));
    const kinds = [...el.querySelectorAll(".win-title .desk-btn")].map((b) =>
      [...b.classList].find((c) => c.startsWith("desk-btn-")),
    );
    expect(kinds).toEqual(["desk-btn-min", "desk-btn-max", "desk-btn-close"]);
    const plain = buildFrame(document, "desk-win-info", "Info").root;
    document.getElementById("desk")!.appendChild(plain);
    new DeskWindow(spec(plain, { id: "info" }));
    expect(plain.querySelector(".desk-btn-max")).toBeNull();
  });

  it("minimizes and restores once each, telling the desk", () => {
    const el = frame();
    const s = spec(el);
    const w = new DeskWindow(s);
    el.querySelector<HTMLElement>(".desk-btn-min")!.click();
    w.minimize();
    expect(el.classList.contains(DESK_MINIMIZED_CLASS)).toBe(true);
    expect(s.changed).toHaveBeenCalledTimes(1);
    expect(s.changed).toHaveBeenCalledWith("min");
    w.restore();
    w.restore();
    expect(el.classList.contains(DESK_MINIMIZED_CLASS)).toBe(false);
    expect(s.changed).toHaveBeenLastCalledWith("restore");
    expect(s.changed).toHaveBeenCalledTimes(2);
  });

  it("maximizes to fill the desk and goes back to where it was, relabeling its button", () => {
    const el = frame();
    const s = spec(el, { canMax: true, limits: LIMITS });
    const w = new DeskWindow(s);
    // happy-dom lays nothing out: read the window's box from its own styles.
    const px = (v: string) => parseFloat(v) || 0;
    for (const [prop, css] of [
      ["offsetLeft", "left"],
      ["offsetTop", "top"],
      ["offsetWidth", "width"],
      ["offsetHeight", "height"],
    ] as const) {
      Object.defineProperty(el, prop, { get: () => px(el.style[css]) });
    }
    w.place({ x: 40, y: 30, w: 500, h: 400 });
    const max = el.querySelector<HTMLElement>(".desk-btn-max")!;
    max.click();
    expect(w.maximized).toBe(true);
    expect(el.classList.contains(DESK_MAXIMIZED_CLASS)).toBe(true);
    expect(el.style.width).toBe("100%");
    expect(max.getAttribute("aria-label")).toBe("Restore Tower One");
    expect(s.changed).toHaveBeenLastCalledWith("max");
    max.click();
    expect(w.maximized).toBe(false);
    expect(el.style.width).toBe("500px");
    expect(el.style.height).toBe("400px");
    expect(max.getAttribute("aria-label")).toBe("Maximize Tower One");
    expect(s.changed).toHaveBeenLastCalledWith("unmax");
  });

  it("shows the restore glyph on the same button while maximized", () => {
    const el = frame();
    new DeskWindow(spec(el, { canMax: true }));
    const max = el.querySelector<HTMLElement>(".desk-btn-max")!;
    const glyph = () => max.querySelector("path")!.getAttribute("d");
    const maxGlyph = glyph();
    max.click();
    expect(el.querySelector(".desk-btn-max")).toBe(max);
    expect(glyph()).not.toBe(maxGlyph);
    expect(max.querySelectorAll("svg")).toHaveLength(1);
    max.click();
    expect(glyph()).toBe(maxGlyph);
  });

  it("never maximizes a window that may not", () => {
    const el = frame();
    const s = spec(el);
    const w = new DeskWindow(s);
    w.toggleMax();
    expect(w.maximized).toBe(false);
    expect(s.changed).not.toHaveBeenCalled();
  });

  it("places a fixed-size window by its corner only", () => {
    const el = frame();
    const w = new DeskWindow(spec(el));
    w.place({ x: 12, y: 34, w: 999, h: 999 });
    expect(el.style.width).toBe("");
    expect(el.style.height).toBe("");
  });

  it("hears a press anywhere in the window", () => {
    const el = frame();
    const s = spec(el);
    new DeskWindow(s);
    el.querySelector(".desk-body")!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(s.pressed).toHaveBeenCalledTimes(1);
  });

  it("resizes from its grip once, on release, and not when the size did not change", () => {
    const el = frame();
    const s = spec(el, { limits: LIMITS });
    new DeskWindow(s);
    const grip = el.querySelector<HTMLElement>(".desk-grip")!;
    const desk = document.getElementById("desk")!;
    Object.defineProperty(desk, "clientWidth", { value: 2000 });
    Object.defineProperty(desk, "clientHeight", { value: 2000 });
    const pointer = (type: string, x: number, y: number) =>
      grip.dispatchEvent(
        Object.assign(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }), { pointerId: 1 }),
      );
    pointer("pointerdown", 100, 100);
    expect(desk.querySelector(".desk-outline")).not.toBeNull();
    pointer("pointerup", 100, 100);
    expect(desk.querySelector(".desk-outline")).toBeNull();
    expect(s.changed).not.toHaveBeenCalled();
    pointer("pointerdown", 100, 100);
    pointer("pointermove", 500, 400);
    const outline = desk.querySelector<HTMLElement>(".desk-outline")!;
    expect(outline.style.width).toBe(`${LIMITS.minW + 100}px`);
    expect(desk.querySelectorAll(".desk-outline")).toHaveLength(1);
    pointer("pointerup", 500, 400);
    expect(desk.querySelector(".desk-outline")).toBeNull();
    expect(s.changed).toHaveBeenCalledWith("resize");
    expect(el.style.width).toBe(`${LIMITS.minW + 100}px`);
  });

  it("drops a resize whose release never came when the grip is pressed again, and on dispose", () => {
    const el = frame();
    const s = spec(el, { limits: LIMITS });
    const w = new DeskWindow(s);
    const grip = el.querySelector<HTMLElement>(".desk-grip")!;
    const desk = document.getElementById("desk")!;
    const pointer = (type: string, x: number, y: number) =>
      grip.dispatchEvent(
        Object.assign(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }), { pointerId: 1 }),
      );
    pointer("pointerdown", 100, 100);
    pointer("pointerdown", 100, 100);
    expect(desk.querySelectorAll(".desk-outline")).toHaveLength(1);
    w.dispose();
    expect(desk.querySelector(".desk-outline")).toBeNull();
    expect(s.changed).not.toHaveBeenCalled();
  });

  it("takes everything it added off again on dispose", () => {
    const el = frame();
    const s = spec(el, { canMax: true, limits: LIMITS });
    const w = new DeskWindow(s);
    w.place({ x: 5, y: 5, w: 400, h: 300 });
    el.classList.add(DESK_ACTIVE_CLASS);
    w.minimize();
    w.dispose();
    expect(el.querySelector(".desk-btn-min, .desk-btn-max, .desk-grip")).toBeNull();
    for (const c of ["desk-win", DESK_MINIMIZED_CLASS, DESK_MAXIMIZED_CLASS, DESK_ACTIVE_CLASS])
      expect(el.classList.contains(c)).toBe(false);
    expect(el.getAttribute("style") ?? "").not.toMatch(/width|height|left|top/);
    el.dispatchEvent(new Event("pointerdown"));
    expect(s.pressed).not.toHaveBeenCalled();
  });

  it("hears the moves of a window the game moves itself, and stops when it lets the window go", () => {
    const el = frame();
    const mover = new MovableWindow({ win: el, title: `#${el.id} > .win-title`, within: WITHIN_PARENT });
    const hear = vi.spyOn(mover, "hear");
    const s = spec(el, { layer: "tool" });
    const win = new DeskWindow(s);
    expect(hear).toHaveBeenCalledTimes(1);
    hear.mock.calls[0][0]({ x: 10, y: 20 });
    expect(s.changed).toHaveBeenCalledWith("move");
    const unhook = hear.mock.results[0].value as () => boolean;
    win.dispose();
    expect(unhook()).toBe(false);
  });

  it("gives a window the game drew the desk's title icon, and takes it off again", () => {
    const el = document.createElement("section");
    el.id = "overview-map";
    el.innerHTML = `<div class="win-title">Map<button class="btn xs">x</button></div>`;
    document.body.appendChild(el);
    const win = new DeskWindow(spec(el, { layer: "tool" }));
    const icon = el.querySelector(".win-title")!.firstElementChild!;
    expect(icon.className).toBe("desk-title-icon");
    expect(icon.getAttribute("src")).toBe("./favicon.png");
    win.dispose();
    expect(el.querySelector(".desk-title-icon")).toBeNull();
  });

  it("gives a window the game drew the icon its spec names", () => {
    const el = document.createElement("section");
    el.id = "bulletin";
    el.innerHTML = `<div class="win-title">Bulletin</div>`;
    document.body.appendChild(el);
    new DeskWindow(spec(el, { layer: "tool", icon: "/app/icon.png" }));
    expect(el.querySelector(".desk-title-icon")!.getAttribute("src")).toBe("/app/icon.png");
  });

  it("keeps a desk frame to the one icon it was built with", () => {
    const win = new DeskWindow(spec(frame()));
    expect(document.querySelectorAll(".desk-title-icon")).toHaveLength(1);
    win.dispose();
  });
});
