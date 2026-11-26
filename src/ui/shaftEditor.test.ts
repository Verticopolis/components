import { html, render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import { catalogFor } from "../tests/catalogFixture";
import { editorCardTemplate, editorFact } from "./editorCard";
import {
  shaftEditorTemplate,
  type ShaftEditAction,
  type ShaftEditorFacts,
  type ShaftEditorOptions,
} from "./shaftEditor";

const classic = catalogFor("classic");

const elevator: ShaftEditorFacts = {
  id: 3,
  kind: "elevatorStandard",
  bottom: 1,
  top: 12,
  cars: 2,
  capacity: 21,
};

const ALL: ReadonlySet<ShaftEditAction> = new Set([
  "removecar",
  "addcar",
  "schedule",
  "extendDown",
  "extendUp",
  "sell",
]);

function draw(t: ShaftEditorFacts, over: Partial<ShaftEditorOptions> = {}) {
  const act = vi.fn();
  const close = vi.fn();
  const el = document.createElement("div");
  render(
    shaftEditorTemplate(t, classic, { offers: ALL, act, close, resale: 40_000, stops: "skips 1 floor", ...over }),
    el,
  );
  const field = (name: string) => el.querySelector(`[data-field="${name}"]`)?.textContent;
  const buttons = () => [...el.querySelectorAll<HTMLButtonElement>("button[data-act]")].map((b) => b.dataset.act);
  const press = (action: string) => el.querySelector<HTMLButtonElement>(`button[data-act="${action}"]`)!;
  return { el, act, close, field, buttons, press };
}

describe("shaftEditorTemplate", () => {
  it("draws an elevator's facts", () => {
    const { el, field } = draw(elevator);
    expect(el.querySelector(".win-title")?.textContent).toContain("Standard Elevator");
    expect(field("serves")).toBe("1 – 12");
    expect(field("height")).toBe("12 floors");
    expect(field("cars")).toBe("2 / 8 max");
    expect(field("capacity")).toBe("21 riders/trip");
    expect(field("stops")).toBe("skips 1 floor");
    expect(el.textContent).toContain("$40,000");
  });

  it("calls the game's act with each button's action, in the card's order", () => {
    const { buttons, press, act } = draw(elevator);
    expect(buttons()).toEqual(["removecar", "addcar", "schedule", "extendDown", "extendUp", "sell"]);
    for (const action of buttons()) press(action!).click();
    expect(act.mock.calls.map((c) => c[0])).toEqual(buttons());
  });

  it("carries only the buttons the game offers, and no resale line when it gives none", () => {
    const { buttons, el } = draw(elevator, { offers: new Set(["removecar", "addcar"]), resale: null });
    expect(buttons()).toEqual(["removecar", "addcar"]);
    expect(el.textContent).not.toContain("Resale");
  });

  it("turns + Car off at the catalog's limit and any button the game turns off", () => {
    expect(draw({ ...elevator, cars: 8 }).press("addcar").disabled).toBe(true);
    expect(draw({ ...elevator, cars: 8 }).press("removecar").disabled).toBe(false);
    const fewest = draw({ ...elevator, cars: 1 }, { disabled: new Set(["removecar"]) });
    expect(fewest.press("removecar").disabled).toBe(true);
    expect(fewest.press("addcar").disabled).toBe(false);
    // One car with nothing turned off: the fewest cars is the game's rule.
    expect(draw({ ...elevator, cars: 1 }).press("removecar").disabled).toBe(false);
  });

  it("shows the game's stops line, and none when it gives none", () => {
    expect(draw(elevator, { stops: "lobbies and sky lobbies" }).field("stops")).toBe("lobbies and sky lobbies");
    expect(draw(elevator, { stops: null }).field("stops")).toBeUndefined();
  });

  it("gives stairs no cars, stops, schedule or extend, whatever the game offers", () => {
    const { buttons, field } = draw({ ...elevator, kind: "stairs", cars: 0 });
    expect(buttons()).toEqual(["sell"]);
    expect(field("cars")).toBeUndefined();
    expect(field("stops")).toBeUndefined();
  });

  it("closes with its ✕", () => {
    const { el, close, act } = draw(elevator);
    el.querySelector<HTMLButtonElement>(".win-title button")!.click();
    expect(close).toHaveBeenCalledOnce();
    expect(act).not.toHaveBeenCalled();
  });

  it("draws the game's problem lines under the facts, and no block without any", () => {
    const el = document.createElement("div");
    const opts = { offers: ALL, act: () => {}, close: () => {}, resale: null, stops: null };
    render(shaftEditorTemplate(elevator, classic, { ...opts, lines: [html`<p>Too busy</p>`] }), el);
    expect(el.querySelector(".ed-diagnostics")?.textContent).toBe("Too busy");
    render(shaftEditorTemplate(elevator, classic, opts), el);
    expect(el.querySelector(".ed-diagnostics")).toBeNull();
  });
});

describe("editorCardTemplate", () => {
  it("draws a fresh card for a new key, so no button carries over", () => {
    const el = document.createElement("div");
    const card = (key: string) =>
      editorCardTemplate({ key, title: "Office", facts: [editorFact("Floor", 4)], actions: [], close: () => {} });
    render(card("unit:1"), el);
    const first = el.querySelector("button");
    render(card("unit:1"), el);
    expect(el.querySelector("button")).toBe(first);
    render(card("unit:2"), el);
    expect(el.querySelector("button")).not.toBe(first);
  });
});
