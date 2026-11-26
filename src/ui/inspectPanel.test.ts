import { html } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import {
  HAS_HELP_CLASS,
  InspectController,
  InspectPanel,
  inspectPlacement,
  type InspectPick,
  type InspectShown,
} from "./inspectPanel";

const unit = (id: number): InspectPick => ({ type: "unit", id, kind: "office" });
const floorPick: InspectPick = { type: "unit", id: 0, kind: "floor" };

function controller(card: (id: number) => InspectShown | null = (id) => shown(id)) {
  const deps = {
    card: vi.fn((t: { type: string; id: number }, _fresh: boolean) => card(t.id)),
    show: vi.fn(),
    setAnchor: vi.fn(),
  };
  return { deps, c: new InspectController(deps) };
}

function shown(id: number): InspectShown {
  return { body: html`<h4>Room ${id}</h4>`, anchor: { x: id + 9, left: id, floor: 3 } };
}

describe("the inspect controller", () => {
  it("shows a facility's card, pins it and hides it for no pick or a floor tile", () => {
    const { deps, c } = controller();
    c.inspect(unit(5));
    expect(deps.card).toHaveBeenLastCalledWith({ type: "unit", id: 5 }, true);
    expect(deps.setAnchor).toHaveBeenLastCalledWith({ x: 14, left: 5, floor: 3 });
    expect(deps.show).toHaveBeenLastCalledWith(shown(5).body);
    expect(c.current).toEqual({ type: "unit", id: 5 });
    c.inspect(unit(5));
    expect(deps.card).toHaveBeenLastCalledWith({ type: "unit", id: 5 }, false);
    c.inspect(floorPick);
    expect(deps.show).toHaveBeenLastCalledWith(null);
    expect(deps.setAnchor).toHaveBeenLastCalledWith(null);
    expect(c.current).toBeNull();
  });

  it("hides when the game has no card for the facility", () => {
    const { deps, c } = controller(() => null);
    c.inspect(unit(5));
    expect(deps.show).toHaveBeenLastCalledWith(null);
    expect(c.current).toBeNull();
  });

  it("keeps a closed card closed over the same facility, through jitter, until another pick", () => {
    const { deps, c } = controller();
    c.inspect(unit(5));
    c.dismiss();
    deps.card.mockClear();
    c.inspect(unit(5));
    c.inspect(null);
    c.inspect(unit(5));
    expect(deps.card).not.toHaveBeenCalled();
    c.inspect(unit(6));
    expect(deps.card).toHaveBeenCalledOnce();
    c.inspect(unit(5));
    expect(deps.card).toHaveBeenCalledTimes(2);
  });

  it("lets a tap or a new tower re-open a closed card", () => {
    const { deps, c } = controller();
    c.inspect(unit(5));
    c.dismiss();
    c.resetLatch();
    deps.card.mockClear();
    c.inspect(unit(5));
    expect(deps.card).toHaveBeenCalledOnce();
    c.dismiss();
    c.clear();
    c.inspect(unit(5));
    expect(deps.card).toHaveBeenCalledTimes(2);
  });

  it("reads the card again after a step for a facility that stands, and hides one that went", () => {
    const { deps, c } = controller();
    c.inspect(unit(5));
    deps.card.mockClear();
    c.followStep(() => true);
    expect(deps.card).toHaveBeenCalledOnce();
    c.followStep(() => false);
    expect(deps.show).toHaveBeenLastCalledWith(null);
    c.inspect(unit(7));
    c.dismiss();
    c.followStep(() => false);
    deps.card.mockClear();
    c.inspect(unit(7));
    expect(deps.card).toHaveBeenCalledOnce();
  });
});

describe("the inspect panel", () => {
  function panel() {
    const el = document.createElement("div");
    el.id = "inspector";
    el.className = "hidden";
    document.body.append(el);
    return { el, p: new InspectPanel(el) };
  }

  it("shows a card, marks a Help link, and hides without losing the card", () => {
    const { el, p } = panel();
    expect(p.open).toBe(false);
    p.show(html`<h4>Office</h4><a class="help-topic" href="#">Help</a>`);
    expect(p.open).toBe(true);
    expect(el.classList.contains(HAS_HELP_CLASS)).toBe(true);
    p.peek(true);
    p.show(null);
    expect(p.open).toBe(false);
    expect(el.classList.contains("peek")).toBe(false);
    expect(el.textContent).toContain("Office");
    p.show(html`<h4>Shop</h4>`);
    expect(el.classList.contains(HAS_HELP_CLASS)).toBe(false);
  });

  it("pins beside a facility and lets go again", () => {
    const { el, p } = panel();
    p.show(html`<h4>Office</h4>`);
    p.pin({ x: 100, y: 50, w: 40 }, 800, 600);
    expect(el.style.top).toBe("50px");
    expect(el.style.right).toBe("auto");
    p.unpin();
    expect(el.style.left).toBe("");
    expect(el.style.right).toBe("");
  });
});

describe("where a card pins", () => {
  const size = { w: 200, h: 100 };

  it("goes off the facility's right side", () => {
    expect(inspectPlacement({ x: 100, y: 50, w: 40 }, size, 800, 600)).toEqual({ left: 152, top: 50 });
  });

  it("flips to the left near the right edge, and stays on screen", () => {
    expect(inspectPlacement({ x: 600, y: 50, w: 40 }, size, 800, 600)).toEqual({ left: 388, top: 50 });
    expect(inspectPlacement({ x: 100, y: 580, w: 40 }, size, 800, 600)).toEqual({ left: 152, top: 492 });
    expect(inspectPlacement({ x: 50, y: -20, w: 700 }, size, 800, 600)).toEqual({ left: 8, top: 8 });
  });
});
