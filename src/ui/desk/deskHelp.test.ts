import { afterEach, describe, expect, it, vi } from "vitest";
import { HELP_WINDOW_ID, buildHelpWindow, type HelpWindowMenu } from "./deskHelp";

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

/** A menu bar with a File menu whose Exit runs `exit`. */
function menu(exit = vi.fn(), onOpen?: HelpWindowMenu["onOpen"]): HelpWindowMenu {
  return {
    model: {
      label: "Player's Manual menu",
      menus: [
        { id: "hw-file", label: "File", mnemonic: 0, items: [{ label: "Exit", onPick: exit }] },
        { id: "hw-edit", label: "Edit", mnemonic: 0, items: [{ label: "Find…" }] },
      ],
    },
    onOpen,
  };
}

/** The window placed on the page, as the desk places it. */
function placed(a = actions(), m = menu()) {
  const w = buildHelpWindow(document, "Player's Manual", a, m);
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

  it("draws its menu bar between the title bar and the buttons, and runs a pick", () => {
    const exit = vi.fn();
    const onOpen = vi.fn();
    const w = placed(actions(), menu(exit, onOpen));
    const bar = w.root.querySelector<HTMLElement>(".menubar")!;
    expect([...bar.querySelectorAll(".mb-title")].map((t) => t.textContent)).toEqual(["File", "Edit"]);
    expect(
      bar.compareDocumentPosition(w.root.querySelector(".desk-help-bar")!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    bar.querySelector<HTMLButtonElement>(".mb-title")!.click();
    expect(onOpen).toHaveBeenCalledTimes(1);
    [...bar.querySelectorAll<HTMLElement>(".mb-item")].find((i) => i.textContent?.includes("Exit"))!.click();
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it("leaves Alt and the menus' letters to the game's own menu bar", () => {
    const onOpen = vi.fn();
    placed(actions(), menu(vi.fn(), onOpen));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", altKey: true, bubbles: true }));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("renders a new menu model in place", () => {
    const w = placed();
    w.menus.render({ label: "Player's Manual menu", menus: [{ id: "hw-help", label: "Help", items: [] }] });
    expect([...w.root.querySelectorAll(".mb-title")].map((t) => t.textContent)).toEqual(["Help"]);
  });

  it("takes its menu bar's page listeners off on dispose", () => {
    const w = placed();
    const outside = document.createElement("div");
    document.body.append(outside);
    const under = vi.fn();
    outside.addEventListener("pointerdown", under);
    w.root.querySelector<HTMLButtonElement>(".mb-title")!.click();
    w.dispose();
    outside.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));
    expect(under).toHaveBeenCalledTimes(1);
    expect(w.root.querySelector<HTMLElement>(".mb-pop")!.hidden).toBe(false);
  });

  it("renames the window", () => {
    const w = placed();
    w.setTitle("Elevators - Player's Manual");
    expect(w.root.querySelector(".desk-title-text")!.textContent).toBe("Elevators - Player's Manual");
  });
});
