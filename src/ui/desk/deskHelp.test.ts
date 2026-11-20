import { afterEach, describe, expect, it, vi } from "vitest";
import { HELP_WINDOW_ID, buildHelpWindow } from "./deskHelp";

function actions() {
  return {
    contents: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    openInBrowser: vi.fn(),
    close: { label: "Close Help", onClick: vi.fn() },
  };
}

const button = (root: HTMLElement, label: string) =>
  [...root.querySelectorAll<HTMLButtonElement>(".desk-help-bar button")].find((b) => b.textContent === label)!;

/** The window placed on the page, as the desk places it. */
function placed(a = actions()) {
  const w = buildHelpWindow(document, "Player's Manual", a);
  document.body.append(w.root);
  return w;
}

afterEach(() => document.body.replaceChildren());

describe("buildHelpWindow", () => {
  it("draws a titled window with the buttons above an empty page frame", () => {
    const w = placed();
    expect(w.root.id).toBe(HELP_WINDOW_ID);
    expect(w.root.querySelector(".desk-title-text")!.textContent).toBe("Player's Manual");
    expect([...w.root.querySelectorAll(".desk-help-bar button")].map((b) => b.textContent)).toEqual([
      "Contents",
      "Back",
      "Forward",
      "Open in Browser",
    ]);
    expect(w.page.tagName).toBe("IFRAME");
    expect(w.page.parentElement).toBe(w.body);
    expect(w.page.getAttribute("src")).toBeNull();
  });

  it("runs each button's action and the title bar's close", () => {
    const a = actions();
    const w = placed(a);
    w.setNav({ back: true, forward: true });
    for (const label of ["Contents", "Back", "Forward", "Open in Browser"]) button(w.root, label).click();
    expect(a.contents).toHaveBeenCalledTimes(1);
    expect(a.back).toHaveBeenCalledTimes(1);
    expect(a.forward).toHaveBeenCalledTimes(1);
    expect(a.openInBrowser).toHaveBeenCalledTimes(1);
    w.root.querySelector<HTMLButtonElement>(".win-title button")!.click();
    expect(a.close.onClick).toHaveBeenCalledTimes(1);
  });

  it("turns Back and Forward on only when they can go somewhere", () => {
    const w = placed();
    expect(button(w.root, "Back").disabled).toBe(true);
    expect(button(w.root, "Forward").disabled).toBe(true);
    w.setNav({ back: true, forward: false });
    expect(button(w.root, "Back").disabled).toBe(false);
    expect(button(w.root, "Forward").disabled).toBe(true);
  });

  it("renames the window", () => {
    const w = placed();
    w.setTitle("Elevators - Player's Manual");
    expect(w.root.querySelector(".desk-title-text")!.textContent).toBe("Elevators - Player's Manual");
  });
});
