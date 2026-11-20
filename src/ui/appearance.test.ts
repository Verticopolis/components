import { afterEach, describe, expect, it, vi } from "vitest";
import { openAppearanceDialog } from "./appearance";
import { ModalShell } from "./uiModal";

function shell() {
  document.body.innerHTML = `<dialog id="modal"></dialog>`;
  const dialog = document.getElementById("modal") as HTMLDialogElement;
  return { shell: new ModalShell(dialog, { gameStopped: () => false, toast: vi.fn() }), dialog };
}

function choose(box: HTMLElement, id: string) {
  const radio = box.querySelector<HTMLInputElement>(`input[value="${id}"]`)!;
  radio.checked = true;
  radio.dispatchEvent(new Event("change"));
}

const press = (box: HTMLElement, which: "ok" | "cancel") =>
  box.querySelector<HTMLButtonElement>(`[data-appearance="${which}"]`)!.click();

afterEach(() => {
  document.body.innerHTML = "";
});

describe("the Appearance dialog", () => {
  it("opens titled Appearance with the three schemes and the current one picked and focused", () => {
    const { shell: s, dialog } = shell();
    const box = openAppearanceDialog(s, "skyline", vi.fn());
    expect(dialog.open).toBe(true);
    expect(box.querySelector(".win-title")!.textContent).toContain("Appearance");
    const names = [...box.querySelectorAll(".appearance-name")].map((n) => n.textContent);
    expect(names).toEqual(["Standard", "Skyline", "High Contrast"]);
    const current = box.querySelector<HTMLInputElement>('input[value="skyline"]')!;
    expect(current.checked).toBe(true);
    expect(document.activeElement).toBe(current);
  });

  it("paints each picture in its own scheme", () => {
    const { shell: s } = shell();
    const box = openAppearanceDialog(s, "standard", vi.fn());
    const samples = [...box.querySelectorAll<HTMLElement>(".appearance-sample")].map((n) => n.dataset.sample);
    expect(samples).toEqual(["standard", "skyline", "high_contrast"]);
  });

  it("hands OK the picked scheme after the dialog has closed", () => {
    const { shell: s, dialog } = shell();
    let openAtSave: boolean | null = null;
    const save = vi.fn(() => {
      openAtSave = dialog.open;
    });
    const box = openAppearanceDialog(s, "standard", save);
    choose(box, "high_contrast");
    press(box, "ok");
    expect(save).toHaveBeenCalledWith("high_contrast");
    expect(openAtSave).toBe(false);
  });

  it("changes nothing on Cancel, even after a pick", () => {
    const { shell: s, dialog } = shell();
    const save = vi.fn();
    const box = openAppearanceDialog(s, "standard", save);
    choose(box, "skyline");
    press(box, "cancel");
    expect(save).not.toHaveBeenCalled();
    expect(dialog.open).toBe(false);
  });

  it("shows the caller's note under the pictures", () => {
    const { shell: s } = shell();
    const box = openAppearanceDialog(s, "standard", vi.fn(), { note: "Your tower stays the same." });
    expect(box.querySelector(".appearance-note")!.textContent).toBe("Your tower stays the same.");
  });

  it("lets another dialog take its place unless the caller says otherwise", () => {
    const { shell: s, dialog } = shell();
    openAppearanceDialog(s, "standard", vi.fn());
    expect(s.precedence.ownsPendingWork(dialog.open)).toBe(false);
    openAppearanceDialog(s, "standard", vi.fn(), { displaceable: false });
    expect(s.precedence.ownsPendingWork(dialog.open)).toBe(true);
  });
});
