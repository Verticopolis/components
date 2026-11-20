import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ModalShell } from "../uiModal";
import { ctxDouble } from "./saverTestKit.fixture";
import { openScreenSaverDialog, type SaverDialogPorts } from "./saverDialog";
import type { SaverPrefs } from "./saverPrefs";

/** The shared modal on a page of its own, with `box()` the open dialog's box. */
function shellDouble() {
  document.body.innerHTML = `<dialog id="modal"></dialog>`;
  const dialog = document.getElementById("modal") as HTMLDialogElement;
  const shell = new ModalShell(dialog, { gameStopped: () => false, toast: vi.fn() });
  const box = () => (dialog.open ? dialog.querySelector<HTMLElement>(".modal-box") : null);
  return { shell, dialog, box };
}

function portsDouble(): SaverDialogPorts & { [K in keyof SaverDialogPorts]: ReturnType<typeof vi.fn> } {
  return {
    makeScene: vi.fn(() => ({ step: vi.fn(), draw: vi.fn() })),
    still: vi.fn(() => true),
    save: vi.fn(),
    preview: vi.fn(),
  } as never;
}

const start: SaverPrefs = { saver: "night", waitMinutes: 5, onReturn: true };

function pick(box: HTMLElement, selector: string, value: string) {
  const s = box.querySelector<HTMLSelectElement>(selector)!;
  s.value = value;
  s.dispatchEvent(new Event("change"));
}

describe("the Screen Saver dialog", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctxDouble() as unknown as CanvasRenderingContext2D,
    );
  });
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("shows the current choices and plays the picked saver on the little monitor", () => {
    const { shell, box } = shellDouble();
    const ports = portsDouble();
    openScreenSaverDialog(shell, start, ports);
    const b = box()!;
    expect(b.querySelector<HTMLSelectElement>("#saver-pick")!.value).toBe("night");
    expect(b.querySelector<HTMLSelectElement>("#saver-wait")!.value).toBe("5");
    expect(b.querySelector<HTMLInputElement>("#saver-return")!.checked).toBe(true);
    expect(ports.makeScene).toHaveBeenCalledWith("night", 88, 66);
    expect(b.querySelector(".win-title")!.textContent).toContain("Screen Saver");
    expect(shell.precedence.ownsPendingWork(true)).toBe(false);
  });

  it("keeps the choices on OK", () => {
    const { shell, box } = shellDouble();
    const ports = portsDouble();
    openScreenSaverDialog(shell, start, ports);
    pick(box()!, "#saver-pick", "marquee");
    expect(ports.makeScene).toHaveBeenLastCalledWith("marquee", 88, 66);
    pick(box()!, "#saver-wait", "15");
    const check = box()!.querySelector<HTMLInputElement>("#saver-return")!;
    check.checked = false;
    check.dispatchEvent(new Event("change"));
    box()!.querySelector<HTMLButtonElement>('[data-act="ok"]')!.click();
    expect(ports.save).toHaveBeenCalledWith({ saver: "marquee", waitMinutes: 15, onReturn: false });
    expect(box()).toBeNull();
  });

  it("drops the choices on Cancel", () => {
    const { shell, box } = shellDouble();
    const ports = portsDouble();
    openScreenSaverDialog(shell, start, ports);
    pick(box()!, "#saver-pick", "stars");
    box()!.querySelector<HTMLButtonElement>('[data-act="cancel"]')!.click();
    expect(ports.save).not.toHaveBeenCalled();
    expect(box()).toBeNull();
  });

  it("grays Preview, Wait and the box with no saver picked, and blacks the monitor", () => {
    const { shell, box } = shellDouble();
    const ports = portsDouble();
    openScreenSaverDialog(shell, start, ports);
    ports.makeScene.mockClear();
    pick(box()!, "#saver-pick", "none");
    const b = box()!;
    expect(b.querySelector<HTMLButtonElement>('[data-saver="preview"]')!.disabled).toBe(true);
    expect(b.querySelector<HTMLSelectElement>("#saver-wait")!.disabled).toBe(true);
    expect(b.querySelector<HTMLInputElement>("#saver-return")!.disabled).toBe(true);
    expect(ports.makeScene).not.toHaveBeenCalled();
    // Picking a saver again plays it and frees the controls, in the same box.
    const same = b;
    pick(b, "#saver-pick", "stars");
    expect(box()).toBe(same);
    expect(ports.makeScene).toHaveBeenLastCalledWith("stars", 88, 66);
    expect(b.querySelector<HTMLSelectElement>("#saver-wait")!.disabled).toBe(false);
  });

  it("says the page's own words under Wait and under the choices", () => {
    const { shell, box } = shellDouble();
    openScreenSaverDialog(shell, start, portsDouble(), {
      waitCaption: "minutes, while the tower is paused",
      note: "Any key brings your tower back.",
    });
    expect(box()!.querySelector(".saver-row:nth-of-type(2) span")!.textContent).toBe(
      "minutes, while the tower is paused",
    );
    expect(box()!.querySelector(".saver-note")!.textContent).toBe("Any key brings your tower back.");
  });

  it("previews full screen, then comes back with the unsaved choices", () => {
    const { shell, box } = shellDouble();
    const ports = portsDouble();
    openScreenSaverDialog(shell, start, ports);
    pick(box()!, "#saver-pick", "express");
    box()!.querySelector<HTMLButtonElement>('[data-saver="preview"]')!.click();
    expect(box()).toBeNull();
    expect(ports.preview).toHaveBeenCalledWith("express", expect.any(Function));
    const back = ports.preview.mock.calls[0][1] as () => void;
    back();
    expect(box()!.querySelector<HTMLSelectElement>("#saver-pick")!.value).toBe("express");
    expect(ports.save).not.toHaveBeenCalled();
  });
});
