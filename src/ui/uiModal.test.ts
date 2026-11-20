import { afterEach, describe, expect, it, vi } from "vitest";
import { html } from "lit-html";
import { MODAL_TITLE_ID, ModalShell, type ModalView } from "./uiModal";

function shell(stopped = false) {
  document.body.innerHTML = `<dialog id="modal"></dialog>`;
  const dialog = document.getElementById("modal") as HTMLDialogElement;
  const deps = { gameStopped: vi.fn(() => stopped), toast: vi.fn() };
  return { modal: new ModalShell(dialog, deps), dialog, deps };
}

const view = (title: unknown, body = html`<p class="body">Body</p><button type="button" class="ok">OK</button>`) =>
  ({ title, body }) satisfies ModalView;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ModalShell", () => {
  it("draws the window grammar around a view and opens the dialog", () => {
    const { modal, dialog } = shell();
    const box = modal.open(view("Saves"));
    expect(dialog.open).toBe(true);
    expect(box.className).toBe("modal-box win win-closable");
    expect(box.parentElement).toBe(dialog);
    const h2 = box.firstElementChild!;
    expect(h2.tagName).toBe("H2");
    expect(h2.className).toBe("win-title");
    const span = h2.querySelector(`#${MODAL_TITLE_ID}`)!;
    expect(span.tagName).toBe("SPAN");
    expect(span.textContent).toBe("Saves");
    expect(dialog.getAttribute("aria-labelledby")).toBe(MODAL_TITLE_ID);
    const x = h2.querySelector<HTMLButtonElement>(":scope > button.modal-x")!;
    expect(x.className).toBe("modal-x btn xs");
    expect(x.type).toBe("button");
    expect(x.getAttribute("aria-label")).toBe("Close");
    expect(x.textContent).toBe("✕");
    expect(span.contains(x)).toBe(false);
    expect(h2.nextElementSibling!.className).toBe("body");
  });

  it("draws the ✕ only after showModal, so the focus lands on the dialog's own control", () => {
    const { modal, dialog } = shell();
    const seen: Array<Element | null> = [];
    dialog.showModal = vi.fn(function (this: HTMLDialogElement) {
      seen.push(this.querySelector(".modal-x"));
      this.open = true;
    });
    modal.open(view("Saves"));
    expect(seen).toEqual([null]);
    expect(dialog.querySelector(".modal-x")).not.toBeNull();
  });

  it("never opens behind a game-failure message, whose Reload button the top layer would cover", () => {
    const { modal, dialog, deps } = shell(true);
    modal.open(view("Import report"));
    expect(deps.gameStopped).toHaveBeenCalled();
    expect(dialog.open).toBe(false);
  });

  it("the ✕ goes through the cancel path, so a caller's own oncancel hears it; Esc and the backdrop close", () => {
    const { modal, dialog } = shell();
    modal.open(view("Choice"));
    const cancel = vi.fn();
    dialog.oncancel = cancel;
    dialog.querySelector<HTMLElement>(".modal-x")!.click();
    expect(cancel).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);

    modal.open(view("Saves"));
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(dialog.open).toBe(false);

    modal.open(view("Saves"));
    dialog.querySelector<HTMLElement>(".body")!.click();
    expect(dialog.open).toBe(true);
    dialog.click();
    expect(dialog.open).toBe(false);
  });

  it("redraws an open view in place, and draws fresh elements for every open", () => {
    const { modal, dialog } = shell();
    const field = (value: string) => ({ title: "Rename", body: html`<input class="name" .value=${value} />` });
    modal.open(field("One"));
    const input = dialog.querySelector<HTMLInputElement>(".name")!;
    modal.render(field("Two"));
    expect(dialog.querySelector(".name")).toBe(input);
    expect(input.value).toBe("Two");
    modal.open(field("Two"));
    expect(dialog.querySelector(".name")).not.toBe(input);
    expect(dialog.querySelectorAll(".modal-box")).toHaveLength(1);
  });

  it("clears the dialog and its label on close, then lets a waiting report in", () => {
    const { modal, dialog } = shell();
    modal.open(view("Busy"));
    const resolved = vi.fn();
    modal.precedence.wait(resolved, vi.fn());
    modal.close();
    expect(dialog.open).toBe(false);
    expect(dialog.querySelector(".modal-box")).toBeNull();
    expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
    expect(resolved).toHaveBeenCalledOnce();
    modal.close();
    expect(resolved).toHaveBeenCalledOnce();
  });

  it("does nothing on render with no dialog open", () => {
    const { modal, dialog } = shell();
    modal.render(view("Late"));
    expect(dialog.querySelector(".modal-box")).toBeNull();
  });
});

describe("ModalShell.say", () => {
  const notices = (dialog: HTMLDialogElement) =>
    [...dialog.querySelectorAll(".modal-notice")].map((n) => n.textContent);

  it("draws the line under the dialog's title, and a second ask rebuilds it", () => {
    const { modal, dialog, deps } = shell();
    modal.open(view("Elevator schedule"));
    modal.say("Hello");
    const first = dialog.querySelector(".modal-notice")!;
    expect(first.textContent).toBe("Hello");
    expect(dialog.querySelector("h2")!.nextElementSibling).toBe(first);
    modal.say("Hello");
    const second = dialog.querySelector(".modal-notice");
    expect(second).not.toBe(first);
    expect(notices(dialog)).toEqual(["Hello"]);
    expect(deps.toast).not.toHaveBeenCalled();
  });

  it("leaves a line the dialog already shows alone when asked not to say it again (#1121)", () => {
    const { modal, dialog } = shell();
    modal.open(view("Elevator schedule"));
    modal.say("Waiting", false);
    const first = dialog.querySelector(".modal-notice")!;
    expect(first.getAttribute("role")).toBe("alert");
    modal.say("Waiting", false);
    expect(dialog.querySelector(".modal-notice")).toBe(first);
  });

  it("leaves a different line alone when asked not to say this one again, so a failure is still read", () => {
    const { modal, dialog } = shell();
    modal.open(view("Elevator schedule"));
    modal.say("Import dropped");
    modal.say("Waiting", false);
    expect(notices(dialog)).toEqual(["Import dropped"]);
  });

  it("still replaces a different line on a plain ask", () => {
    const { modal, dialog } = shell();
    modal.open(view("Elevator schedule"));
    modal.say("Import dropped");
    modal.say("Saved");
    expect(notices(dialog)).toEqual(["Saved"]);
  });

  it("draws and announces only a failure as an error; plain and good news stay calm (#785)", () => {
    const { modal, dialog } = shell();
    modal.open(view("Elevator schedule"));
    modal.say("Export failed");
    const bad = dialog.querySelector(".modal-notice")!;
    expect(bad.className).toBe("modal-notice");
    expect(bad.getAttribute("role")).toBe("alert");
    for (const kind of ["info", "good"] as const) {
      modal.say(`A ${kind} line`, true, kind);
      const calm = dialog.querySelector(".modal-notice")!;
      expect(calm.textContent).toBe(`A ${kind} line`);
      expect(calm.getAttribute("role"), kind).toBe("status");
      expect(calm.className, kind).toBe("modal-notice modal-notice-calm");
    }
  });

  it("keeps a notice across a redraw of the same dialog, and drops it on close", () => {
    const { modal, dialog } = shell();
    modal.open(view("Elevator schedule"));
    modal.say("Saved", true, "good");
    const line = dialog.querySelector(".modal-notice");
    modal.render(view("Elevator schedule", html`<p>Changed</p>`));
    expect(dialog.querySelector(".modal-notice")).toBe(line);
    modal.close();
    modal.open(view("Next"));
    expect(dialog.querySelector(".modal-notice")).toBeNull();
  });

  it("toasts when no dialog is open", () => {
    const { modal, deps } = shell();
    modal.say("Saved", false, "info");
    expect(deps.toast).toHaveBeenCalledExactlyOnceWith("Saved", "info");
  });

  it("holds the line, with its kind, for the next dialog when one is mid-replace", () => {
    const { modal, dialog } = shell();
    let said = false;
    modal.open(view("Report"), {
      onDisplaced: () => {
        modal.say("The earlier export finished after all", true, "good");
        said = true;
      },
    });
    modal.open(view("Next"));
    expect(said).toBe(true);
    const held = dialog.querySelector(".modal-notice")!;
    expect(held.textContent).toBe("The earlier export finished after all");
    expect(held.getAttribute("role")).toBe("status");
  });

  it("holds nothing for the next dialog when asked not to say it again, since that dialog may be the one it waited for", () => {
    const { modal, dialog } = shell();
    modal.open(view("Report"), { onDisplaced: () => modal.say("Waiting", false) });
    modal.open(view("Next"));
    expect(dialog.querySelector(".modal-notice")).toBeNull();
  });
});
