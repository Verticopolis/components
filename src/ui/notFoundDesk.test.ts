import { html, render } from "lit-html";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MIDDLE_BUTTON,
  msToNextMinute,
  notFoundDeskTemplate,
  trayClock,
  type NotFoundDeskView,
  type NotFoundLink,
} from "./notFoundDesk";

describe("trayClock", () => {
  it("reads like the 1995 tray clock", () => {
    expect(trayClock(new Date(2026, 10, 15, 0, 5))).toBe("12:05 AM");
    expect(trayClock(new Date(2026, 10, 15, 9, 41))).toBe("9:41 AM");
    expect(trayClock(new Date(2026, 10, 15, 12, 0))).toBe("12:00 PM");
    expect(trayClock(new Date(2026, 10, 15, 16, 34))).toBe("4:34 PM");
  });

  it("waits until just after the minute turns over", () => {
    expect(msToNextMinute(new Date(2026, 10, 15, 9, 41, 0, 0))).toBe(60_050);
    expect(msToNextMinute(new Date(2026, 10, 15, 9, 41, 59, 900))).toBe(150);
    expect(msToNextMinute(new Date(2026, 10, 15, 9, 41, 30, 250))).toBe(29_800);
  });
});

describe("notFoundDeskTemplate", () => {
  let host: HTMLElement;
  let picked: ReturnType<typeof vi.fn<(act: string, how: string) => void>>;
  const link = (act: string, label: string, href = `/${act}`): NotFoundLink => ({
    act,
    label,
    href,
    onPick: (_e, how) => picked(act, how),
  });
  const VIEW = (): NotFoundDeskView => ({
    title: "Sample Site",
    heading: "Floor 404 hasn't been built yet.",
    path: "/nope",
    lines: ["The link may be mistyped."],
    links: [link("home", "Go home"), link("docs", "Read the docs")],
    close: link("close", "Close and go home", "/"),
    start: link("start", "Sample", "/"),
    task: "Page not found",
    clock: "4:34 PM",
  });
  const draw = (view: Partial<NotFoundDeskView> = {}) => render(notFoundDeskTemplate({ ...VIEW(), ...view }), host);
  const $ = (sel: string) => host.querySelector<HTMLElement>(sel)!;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.replaceChildren(host);
    picked = vi.fn();
  });

  it("names the missing path as text in a message box on the desk, with the caller's words", () => {
    draw({ path: "/help/<b>nope</b>" });
    expect($(".nf-win .nf-title-text").textContent).toBe("Sample Site");
    expect($("#nf-heading").textContent).toBe("Floor 404 hasn't been built yet.");
    expect($(".nf-msg code").textContent).toBe("/help/<b>nope</b>");
    expect($(".nf-msg b")).toBeNull();
    expect([...host.querySelectorAll(".nf-msg p")].map((p) => p.textContent)).toEqual([
      "There is no page at /help/<b>nope</b>.",
      "The link may be mistyped.",
    ]);
    expect($(".nf-tag").textContent).toBe("404");
    expect($(".nf-sky").getAttribute("aria-hidden")).toBe("true");
  });

  it("draws the buttons in order, the first as the default", () => {
    draw();
    const buttons = [...host.querySelectorAll<HTMLAnchorElement>(".nf-buttons a.btn")];
    expect(buttons.map((b) => [b.textContent, b.getAttribute("href"), b.classList.contains("primary")])).toEqual([
      ["Go home", "/home", true],
      ["Read the docs", "/docs", false],
    ]);
  });

  it("draws the ✕ with its spoken name, and the taskbar's start button, task and clock", () => {
    draw();
    expect($(".nf-close").getAttribute("aria-label")).toBe("Close and go home");
    expect($(".nf-start").textContent).toBe("Sample");
    expect($(".nf-start svg")).not.toBeNull();
    expect($(".nf-task").textContent).toBe("Page not found");
    expect($(".nf-tray time").textContent).toBe("4:34 PM");
  });

  it("tells each pick a click from a middle click, and ignores the right button", () => {
    draw();
    for (const sel of ['[data-act="docs"]', ".nf-close", ".nf-start"]) {
      $(sel).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      $(sel).dispatchEvent(new MouseEvent("auxclick", { bubbles: true, button: MIDDLE_BUTTON }));
      $(sel).dispatchEvent(new MouseEvent("auxclick", { bubbles: true, button: 2 }));
    }
    expect(picked.mock.calls).toEqual([
      ["docs", "click"],
      ["docs", "middle"],
      ["close", "click"],
      ["close", "middle"],
      ["start", "click"],
      ["start", "middle"],
    ]);
  });

  it("lets a pick cancel the link", () => {
    draw({ links: [{ href: "/home", label: "Go home", onPick: (e) => e.preventDefault() }] });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    $(".nf-buttons a").dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it("shows the caller's note above the message only when given", () => {
    draw();
    expect($(".nf-body > .page-note")).toBeNull();
    draw({ note: html`<p class="page-note" hidden></p>` });
    expect($(".nf-body > .page-note")).not.toBeNull();
  });

  it("writes only the clock's text when the minute turns over", () => {
    draw();
    const watch = new MutationObserver(() => {});
    watch.observe(host, { subtree: true, childList: true, characterData: true, attributes: true });
    draw({ clock: "4:35 PM" });
    const records = watch.takeRecords();
    watch.disconnect();
    expect(records.map((r) => r.type)).toEqual(["characterData"]);
    expect($(".nf-tray time").textContent).toBe("4:35 PM");
  });
});
