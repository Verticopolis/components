import { html, render } from "lit-html";
import { vi } from "vitest";
import { ModalShell } from "../uiModal";
import type { FileEntry, FileKind, FileRow, FileWords } from "./fileDialogTypes";
import { clockMark, oldTowerMark, towerMark } from "./fileIcons";

/** The words and kinds the file dialog tests hand the windows: a game's
 *  towers, its 1994 towers and its Auto-save. */
export const WORDS: FileWords = {
  one: "tower",
  many: "towers",
  home: "My Towers",
  homeWhere: "in this browser",
  all: "All towers",
  noneInFolder: "There are no tower files (.vctower or .TDT) in that folder.",
  mirror: "Keep a copy of my towers here too",
  kept: "An autosave this version couldn't read is kept.",
};

export const KINDS: readonly FileKind[] = [
  { id: "auto", label: "Auto-save", mark: clockMark },
  { id: "tower", label: "Tower", filter: "Tower (*.vctower)", mark: towerMark },
  { id: "tdt", label: "SimTower 1994", filter: "SimTower 1994 (*.TDT)", mark: oldTowerMark },
];

/** What every window is given besides its folder: the words, the kinds and
 *  simple name rules. */
export const BASICS = {
  words: WORDS,
  kinds: KINDS,
  saveKind: "tower",
  nameMax: 60,
  cleanName: (name: string) =>
    name
      .replace(/[/\\:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60),
  freeName: (name: string, files: readonly FileEntry[]) => {
    for (let n = 1; ; n++) {
      const candidate = n === 1 ? name : `${name} (${n})`;
      if (!files.some((f) => f.name.toLowerCase() === candidate.toLowerCase())) return candidate;
    }
  },
  folderFile: (name: string) => /\.(vctower|tdt)$/i.test(name),
};

export const AUTO: FileRow = { id: "auto", name: "Auto-save (Sky)", kind: "auto", pinned: true, modified: 50 };

export const entry = (id: string, name: string, modified: number, kind = "tower", size = 100): FileEntry => ({
  id,
  name,
  kind,
  size,
  modified,
});

/** A modal shell over a fresh `<dialog>`, with `close` spied on, and the open
 *  window's box. */
export function testShell() {
  render(html`<dialog id="modal"></dialog>`, document.body);
  const dialog = document.getElementById("modal") as HTMLDialogElement;
  const shell = new ModalShell(dialog, { gameStopped: () => false, toast: vi.fn() });
  const close = vi.spyOn(shell, "close");
  const open = vi.spyOn(shell, "open");
  return { shell, dialog, close, open, box: () => dialog.querySelector<HTMLElement>(":scope > .modal-box") };
}
