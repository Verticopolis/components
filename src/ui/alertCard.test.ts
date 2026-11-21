import { html } from "lit-html";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlertCard, type AlertCardView } from "./alertCard";

const CRASH: AlertCardView = {
  title: "The program stopped",
  kind: "alert",
  text: ["Something went wrong.", html`<b>Your work was saved.</b>`],
  status: "",
  buttons: [
    { label: "Download report", act: "download", onPress: vi.fn() },
    { label: "Report a bug", act: "report", href: "https://example.com/new" },
    { label: "Reload", act: "reload", primary: true, onPress: vi.fn() },
  ],
  focus: "reload",
};

describe("AlertCard", () => {
  let showModal: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.replaceChildren();
    showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.showModal = showModal as unknown as () => void;
  });

  afterEach(() => {
    delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal;
  });

  const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;

  it("opens a modal alertdialog at the end of the body, with the title, text, status and buttons", () => {
    const card = new AlertCard(document, "crash-screen", CRASH);
    expect(document.body.lastElementChild).toBe(card.dialog);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(card.dialog.id).toBe("crash-screen");
    expect(card.dialog.getAttribute("role")).toBe("alertdialog");
    expect(card.dialog.getAttribute("aria-labelledby")).toBe("crash-screen-title");
    expect($("#crash-screen-title").textContent).toBe("The program stopped");
    expect([...card.dialog.querySelectorAll("p:not(.crash-status)")].map((p) => p.textContent)).toEqual([
      "Something went wrong.",
      "Your work was saved.",
    ]);
    expect($(".crash-status").getAttribute("aria-live")).toBe("polite");
    expect([...card.dialog.querySelectorAll("[data-act]")].map((b) => b.getAttribute("data-act"))).toEqual([
      "download",
      "report",
      "reload",
    ]);
    expect(card.button("reload")?.classList.contains("primary")).toBe(true);
    expect(document.activeElement).toBe(card.button("reload"));
  });

  it("opens a link button in a new tab, and runs a button's press", () => {
    const card = new AlertCard(document, "crash-screen", CRASH);
    const link = card.button("report") as HTMLAnchorElement;
    expect(link.tagName).toBe("A");
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
    expect(link.getAttribute("href")).toBe("https://example.com/new");
    card.button("download")!.click();
    expect(CRASH.buttons![0].onPress).toHaveBeenCalledTimes(1);
  });

  it("swallows Escape, so only its buttons close it", () => {
    const card = new AlertCard(document, "crash-screen", CRASH);
    const cancel = new Event("cancel", { cancelable: true });
    card.dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
  });

  it("redraws a new status and a busy button in the same elements, and writes nothing on a steady update", () => {
    const card = new AlertCard(document, "crash-screen", CRASH);
    const status = $(".crash-status");
    const watch = new MutationObserver(() => {});
    watch.observe(card.dialog, { subtree: true, childList: true, characterData: true, attributes: true });
    card.update(CRASH);
    expect(watch.takeRecords()).toHaveLength(0);
    const busy = CRASH.buttons!.map((b) => (b.act === "download" ? { ...b, disabled: true } : b));
    card.update({ ...CRASH, status: "Packing…", buttons: busy });
    watch.disconnect();
    expect($(".crash-status")).toBe(status);
    expect(status.textContent).toBe("Packing…");
    expect((card.button("download") as HTMLButtonElement).disabled).toBe(true);
    expect(card.dialog.open).toBe(true);
  });

  it("draws a wait card with no buttons and no status line, its text heard as a status", () => {
    const card = new AlertCard(document, "graphics-recovery", {
      title: "Recovering graphics",
      kind: "wait",
      text: ["The game is restarting its graphics."],
    });
    expect(card.dialog.hasAttribute("role")).toBe(false);
    expect(card.dialog.querySelector("p")?.getAttribute("role")).toBe("status");
    expect(card.dialog.querySelector(".crash-status")).toBeNull();
    expect(card.dialog.querySelector(".modal-actions")).toBeNull();
  });

  it("shows as an open dialog where the page has no showModal", () => {
    delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal;
    const card = new AlertCard(document, "crash-screen", CRASH);
    expect(card.dialog.open).toBe(true);
    expect(document.activeElement).toBe(card.button("reload"));
    card.update({ ...CRASH, status: "Ready." });
    expect(card.dialog.open).toBe(true);
  });

  it("opens again at once when the browser closes it anyway, as one does after several Escapes", () => {
    const card = new AlertCard(document, "crash-screen", CRASH);
    card.dialog.removeAttribute("open");
    card.dialog.dispatchEvent(new Event("close"));
    expect(showModal).toHaveBeenCalledTimes(2);
    expect(card.dialog.open).toBe(true);
    expect(document.activeElement).toBe(card.button("reload"));
  });

  it("opens again in the page's flow where there is no showModal", () => {
    delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal;
    const card = new AlertCard(document, "crash-screen", CRASH);
    card.dialog.removeAttribute("open");
    card.dialog.dispatchEvent(new Event("close"));
    expect(card.dialog.open).toBe(true);
  });

  it("stays closed when its caller closes it", () => {
    const card = new AlertCard(document, "crash-screen", CRASH);
    card.close();
    card.dialog.dispatchEvent(new Event("close"));
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(card.dialog.open).toBe(false);
  });

  it("closes and leaves the page", () => {
    const card = new AlertCard(document, "crash-screen", CRASH);
    card.close();
    expect(card.dialog.open).toBe(false);
    expect(card.dialog.isConnected).toBe(false);
  });
});
