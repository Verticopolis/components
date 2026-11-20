import { afterEach, describe, expect, it, vi } from "vitest";
import { html, render } from "lit-html";
import { messageActionsTemplate, messageBoxTemplate, messageBoxView } from "./messageBox";
import { ModalShell } from "./uiModal";

function shell() {
  document.body.innerHTML = `<dialog id="modal"></dialog>`;
  const dialog = document.getElementById("modal") as HTMLDialogElement;
  return { shell: new ModalShell(dialog, { gameStopped: () => false, toast: vi.fn() }), dialog };
}

const buttonsOf = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLButtonElement>(".modal-actions button")].map((b) => ({
    label: b.textContent,
    className: b.className,
    act: b.dataset.act ?? null,
  }));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("the message box", () => {
  it("draws each paragraph, then the buttons in order in the footer strip", () => {
    const holder = document.createElement("div");
    render(
      messageBoxTemplate({
        title: "Sample Tower",
        text: ["Save the changes to Sample Tower?", html`It has <b>3</b> new rooms.`],
        buttons: [
          { label: "Save", primary: true, act: "save", onPress: vi.fn() },
          { label: "Don't Save", act: "discard", onPress: vi.fn() },
          { label: "Cancel", onPress: vi.fn() },
        ],
      }),
      holder,
    );
    expect([...holder.querySelectorAll("p")].map((p) => p.textContent)).toEqual([
      "Save the changes to Sample Tower?",
      "It has 3 new rooms.",
    ]);
    expect(holder.querySelector(".modal-actions")!.className).toBe("modal-actions modal-footer");
    expect(buttonsOf(holder)).toEqual([
      { label: "Save", className: "btn primary", act: "save" },
      { label: "Don't Save", className: "btn", act: "discard" },
      { label: "Cancel", className: "btn", act: null },
    ]);
    for (const b of holder.querySelectorAll("button")) expect(b.type).toBe("button");
  });

  it("takes one string as one paragraph and escapes it", () => {
    const holder = document.createElement("div");
    render(messageBoxTemplate({ title: "T", text: "<b>not bold</b>", buttons: [] }), holder);
    expect(holder.querySelectorAll("p")).toHaveLength(1);
    expect(holder.querySelector("p")!.textContent).toBe("<b>not bold</b>");
    expect(holder.querySelector("b")).toBeNull();
  });

  it("runs a button's own press and nothing else", () => {
    const holder = document.createElement("div");
    const ok = vi.fn();
    const cancel = vi.fn();
    render(
      messageActionsTemplate([
        { label: "OK", primary: true, onPress: ok },
        { label: "Cancel", onPress: cancel },
      ]),
      holder,
    );
    holder.querySelector<HTMLButtonElement>(".btn.primary")!.click();
    expect(ok).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
  });

  it("marks the button that takes the focus", () => {
    const holder = document.createElement("div");
    render(
      messageActionsTemplate([
        { label: "Yes", onPress: vi.fn() },
        { label: "No", autofocus: true, onPress: vi.fn() },
      ]),
      holder,
    );
    const [yes, no] = holder.querySelectorAll("button");
    expect(yes.hasAttribute("autofocus")).toBe(false);
    expect(no.hasAttribute("autofocus")).toBe(true);
  });

  it("opens in the shared modal with its title, and the icon before it", () => {
    const { shell: s, dialog } = shell();
    const close = vi.fn(() => s.close());
    const box = s.open(
      messageBoxView({
        title: "Emergency",
        icon: "warning",
        text: "A fire has broken out!",
        buttons: [{ label: "OK", primary: true, onPress: close }],
      }),
    );
    const title = box.querySelector(".win-title")!;
    expect(title.textContent).toContain("Emergency");
    expect(title.querySelector("svg")).not.toBeNull();
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    box.querySelector<HTMLButtonElement>(".btn.primary")!.click();
    expect(close).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
  });

  it("leaves a plain title plain", () => {
    expect(messageBoxView({ title: "About", text: "Hi", buttons: [] }).title).toBe("About");
  });
});
