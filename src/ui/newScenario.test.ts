import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { html } from "lit-html";
import { newScenarioCanPlay, newScenarioKeyTarget, newScenarioView, type NewScenario } from "./newScenario";
import type { ScenarioEntry } from "./scenarioList";
import { ModalShell } from "./uiModal";

const entry = (id: string, title: string, locked: string | null = null): ScenarioEntry => ({
  id,
  title,
  facts: [{ label: "Length", value: "6 days" }],
  brief: `${title}'s brief.`,
  best: 1,
  locked,
  goals: [],
});

const STATE: NewScenario = {
  lead: [{ id: "free", title: "Sandbox", note: "No goals", details: html`<p class="lead-text">Build anything.</p>` }],
  entries: [entry("one", "One"), entry("two", "Two"), entry("three", "Three", "Win Two first.")],
  picked: "one",
};

function open(state: NewScenario) {
  document.body.innerHTML = `<dialog id="modal"></dialog>`;
  const dialog = document.getElementById("modal") as HTMLDialogElement;
  const shell = new ModalShell(dialog, { gameStopped: () => false, toast: vi.fn() });
  const on = { pick: vi.fn(), play: vi.fn(), cancel: vi.fn() };
  shell.open(newScenarioView(state, on));
  return { dialog, on };
}

const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim() ?? null;
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("what can be played", () => {
  it("plays a lead entry or an open scenario, and never a locked or unknown one", () => {
    expect(newScenarioCanPlay({ ...STATE, picked: "free" })).toBe(true);
    expect(newScenarioCanPlay({ ...STATE, picked: "two" })).toBe(true);
    expect(newScenarioCanPlay({ ...STATE, picked: "three" })).toBe(false);
    expect(newScenarioCanPlay({ ...STATE, picked: "gone" })).toBe(false);
  });
});

describe("the list's keys", () => {
  it("moves down and up a row, stopping at the ends, and Home and End jump", () => {
    expect(newScenarioKeyTarget(STATE, "ArrowDown")).toBe("two");
    expect(newScenarioKeyTarget(STATE, "ArrowUp")).toBe("free");
    expect(newScenarioKeyTarget({ ...STATE, picked: "free" }, "ArrowUp")).toBe("free");
    expect(newScenarioKeyTarget({ ...STATE, picked: "three" }, "ArrowDown")).toBe("three");
    expect(newScenarioKeyTarget(STATE, "Home")).toBe("free");
    expect(newScenarioKeyTarget(STATE, "End")).toBe("three");
    expect(newScenarioKeyTarget(STATE, "a")).toBeNull();
    expect(newScenarioKeyTarget({ entries: [], picked: "" }, "ArrowDown")).toBeNull();
  });

  it("starts at the first row when nothing is picked yet", () => {
    expect(newScenarioKeyTarget({ ...STATE, picked: "" }, "ArrowDown")).toBe("free");
    expect(newScenarioKeyTarget({ ...STATE, picked: "" }, "ArrowUp")).toBe("free");
  });
});

describe("the New Scenario dialog", () => {
  it("lists the lead entries first, marks the picked one and shows its details", () => {
    const { dialog } = open(STATE);
    expect(text(dialog.querySelector("#modal-title, .win-title"))).toContain("New Scenario");
    const options = [...dialog.querySelectorAll('[role="option"]')];
    expect(options.map((o) => text(o.querySelector(".scn-option-name")))).toEqual(["Sandbox", "One", "Two", "Three"]);
    expect(options.map((o) => o.getAttribute("aria-selected"))).toEqual(["false", "true", "false", "false"]);
    expect(dialog.querySelector('[role="listbox"]')?.getAttribute("aria-activedescendant")).toBe("scn-opt-one");
    expect(text(dialog.querySelector(".scn-pane .scn-h"))).toBe("One");
    expect(text(options[3]!.querySelector(".scn-note"))).toBe("Locked");
  });

  it("shows a lead entry's own details under its title", () => {
    const { dialog } = open({ ...STATE, picked: "free" });
    expect(text(dialog.querySelector(".scn-pane .scn-h"))).toBe("Sandbox");
    expect(text(dialog.querySelector(".scn-pane .lead-text"))).toBe("Build anything.");
  });

  it("picks on a press, plays on a double-click, and the buttons play and cancel", () => {
    const { dialog, on } = open(STATE);
    const options = [...dialog.querySelectorAll<HTMLElement>('[role="option"]')];
    options[2]!.click();
    expect(on.pick).toHaveBeenLastCalledWith("two");
    options[2]!.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(on.play).toHaveBeenCalledTimes(1);
    dialog.querySelector<HTMLButtonElement>('[data-act="play"]')!.click();
    expect(on.play).toHaveBeenCalledTimes(2);
    dialog.querySelector<HTMLButtonElement>('[data-act="cancel"]')!.click();
    expect(on.cancel).toHaveBeenCalledTimes(1);
  });

  it("does not play a locked scenario: Play is off and a double-click only picks it", () => {
    const { dialog, on } = open({ ...STATE, picked: "three" });
    expect(dialog.querySelector<HTMLButtonElement>('[data-act="play"]')!.disabled).toBe(true);
    const shut = dialog.querySelectorAll<HTMLElement>('[role="option"]')[3]!;
    shut.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(on.pick).toHaveBeenLastCalledWith("three");
    expect(on.play).not.toHaveBeenCalled();
    key(dialog.querySelector('[role="listbox"]')!, "Enter");
    expect(on.play).not.toHaveBeenCalled();
  });

  it("moves the pick with the arrow keys and plays on Enter", () => {
    const { dialog, on } = open(STATE);
    const list = dialog.querySelector('[role="listbox"]')!;
    key(list, "ArrowDown");
    expect(on.pick).toHaveBeenLastCalledWith("two");
    key(list, "Home");
    expect(on.pick).toHaveBeenLastCalledWith("free");
    key(list, "Enter");
    expect(on.play).toHaveBeenCalledTimes(1);
  });

  it("scrolls the picked row into view when the pick moves, and only that row", () => {
    const scroll = vi.fn();
    const before = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scroll;
    onTestFinished(() => {
      Element.prototype.scrollIntoView = before;
    });
    document.body.innerHTML = `<dialog id="modal"></dialog>`;
    const dialog = document.getElementById("modal") as HTMLDialogElement;
    const shell = new ModalShell(dialog, { gameStopped: () => false, toast: vi.fn() });
    const on = { pick: vi.fn(), play: vi.fn(), cancel: vi.fn() };
    shell.open(newScenarioView(STATE, on));
    expect(scroll).toHaveBeenCalledTimes(1);
    expect((scroll.mock.contexts[0] as Element).id).toBe("scn-opt-one");
    expect(scroll).toHaveBeenLastCalledWith({ block: "nearest" });
    shell.render(newScenarioView({ ...STATE, picked: "three" }, on));
    expect(scroll).toHaveBeenCalledTimes(2);
    expect((scroll.mock.contexts[1] as Element).id).toBe("scn-opt-three");
    shell.render(newScenarioView({ ...STATE, picked: "three" }, on));
    expect(scroll).toHaveBeenCalledTimes(2);
  });

  it("asks for no pick when a key would not move it", () => {
    const { dialog, on } = open({ ...STATE, picked: "free" });
    key(dialog.querySelector('[role="listbox"]')!, "ArrowUp");
    expect(on.pick).not.toHaveBeenCalled();
  });
});
