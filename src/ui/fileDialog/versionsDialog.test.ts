import { describe, expect, it, vi } from "vitest";
import { testShell } from "./fileDialogTestKit.fixture";
import { towerMark } from "./fileIcons";
import { showVersionsDialog, versionWhen, type FileVersion, type VersionsCtx } from "./versionsDialog";

const NOW = new Date(2026, 10, 17, 18, 0).getTime();
const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 4).getTime();

/** The shell the window opens in, its box once open, and its dialog. */
function makeUi() {
  const t = testShell();
  return { ui: { closeModal: t.close }, shell: t.shell, dialog: t.dialog, box: () => t.box()! };
}

/** The words a game gives the window, around `ctx`. */
const ctxOf = (over: Pick<VersionsCtx, "versions" | "open"> & Partial<VersionsCtx>): VersionsCtx => ({
  name: "Sky",
  mark: towerMark,
  intro: 'Earlier versions of "Sky".',
  empty: "No earlier versions yet. The game keeps one every 10 minutes while you play.",
  ...over,
});

const V: FileVersion[] = [
  { key: "v:F:m2", at: at(17, 15), size: 2048, how: "Saved by you" },
  { key: "v:F:1", at: at(16, 9), size: 1024, how: "Autosaved" },
];

describe("the Previous Versions window", () => {
  it("says when each version was written, the way Windows lists it", () => {
    expect(versionWhen(at(17, 15), NOW)).toMatch(/^Today, /);
    expect(versionWhen(at(16, 9), NOW)).toMatch(/^Yesterday, /);
    expect(versionWhen(at(3, 9), NOW)).toMatch(/^Nov 3, /);
  });

  it("lists the versions, saved by hand or autosaved, with the newest picked", () => {
    const { shell, box: live } = makeUi();
    showVersionsDialog(shell, ctxOf({ versions: V, open: vi.fn() }));
    const box = live();
    const rows = [...box.querySelectorAll(".pv-row")];
    expect(rows.map((r) => r.querySelector(".pv-how")!.textContent)).toEqual(["Saved by you", "Autosaved"]);
    expect(rows[0].getAttribute("aria-selected")).toBe("true");
  });

  it("opens the picked version, and shows why when it couldn't", async () => {
    const { shell, box: live } = makeUi();
    const open = vi.fn(async () => ({ text: "That version is gone.", kind: "bad" as const }));
    showVersionsDialog(shell, ctxOf({ versions: V, open }));
    const box = live();
    box.querySelectorAll<HTMLElement>(".pv-row")[1].click();
    box.querySelector<HTMLButtonElement>(".pv-buttons .primary")!.click();
    await vi.waitFor(() => expect(box.querySelector(".fd-line")?.textContent).toBe("That version is gone."));
    expect(open).toHaveBeenCalledExactlyOnceWith(V[1]);
  });

  it("with no versions, says when the game makes them and offers nothing to open", () => {
    const { ui, shell, box: live } = makeUi();
    showVersionsDialog(shell, ctxOf({ versions: [], open: vi.fn() }));
    const box = live();
    expect(box.querySelector(".fd-empty")!.textContent).toMatch(/every 10 minutes/);
    expect(box.querySelector<HTMLButtonElement>(".pv-buttons .primary")!.disabled).toBe(true);
    box.querySelector<HTMLButtonElement>(".pv-buttons .btn:not(.primary)")!.click();
    expect(ui.closeModal).toHaveBeenCalledOnce();
  });

  describe("closing it without opening a version goes back to the window it came from", () => {
    const cancel = (dialog: HTMLDialogElement, cancelable = true) => {
      const e = new Event("cancel", { cancelable });
      dialog.dispatchEvent(e);
      return e;
    };
    const ways: [string, (box: HTMLElement, dialog: HTMLDialogElement) => void][] = [
      ["Cancel", (box) => box.querySelector<HTMLButtonElement>(".pv-buttons .btn:not(.primary)")!.click()],
      [
        "Esc or the ✕",
        (_box, dialog) =>
          expect(cancel(dialog).defaultPrevented, "the dialog stays open for the window it goes back to").toBe(true),
      ],
      ["a click beside it", (_box, dialog) => dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }))],
    ];
    for (const [how, close] of ways) {
      it(`by ${how}`, () => {
        const { ui, shell, box: live, dialog } = makeUi();
        const back = vi.fn();
        showVersionsDialog(shell, ctxOf({ versions: V, open: vi.fn(), back }));
        const box = live();
        close(box, dialog);
        expect(back).toHaveBeenCalledOnce();
        expect(ui.closeModal).not.toHaveBeenCalled();
      });
    }

    it("and closes, as before, when nothing opened it", () => {
      const { ui, shell, dialog } = makeUi();
      showVersionsDialog(shell, ctxOf({ versions: V, open: vi.fn() }));
      cancel(dialog);
      expect(ui.closeModal).toHaveBeenCalledOnce();
    });

    it("closes when the browser won't keep the dialog open on that Esc", () => {
      const { ui, shell, dialog } = makeUi();
      const back = vi.fn();
      showVersionsDialog(shell, ctxOf({ versions: V, open: vi.fn(), back }));
      cancel(dialog, false);
      expect(back).not.toHaveBeenCalled();
      expect(ui.closeModal).toHaveBeenCalledOnce();
    });

    it("but not while a version is opening, which closes the window itself", async () => {
      const { ui, shell, box: live, dialog } = makeUi();
      const back = vi.fn();
      let opened!: (note: null) => void;
      const open = vi.fn(() => new Promise<null>((done) => (opened = done)));
      showVersionsDialog(shell, ctxOf({ versions: V, open, back }));
      const box = live();
      box.querySelector<HTMLButtonElement>(".pv-buttons .primary")!.click();
      expect(cancel(dialog).defaultPrevented).toBe(true);
      box.querySelector<HTMLButtonElement>(".pv-buttons .btn:not(.primary)")!.click();
      expect(back).not.toHaveBeenCalled();
      expect(ui.closeModal).not.toHaveBeenCalled();
      opened(null);
      await vi.waitFor(() => expect(open).toHaveBeenCalledOnce());
    });
  });
});
