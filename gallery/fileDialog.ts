/**
 * The Open and Save As windows (`windows/fileDialog/fileDialog`) and
 * Previous Versions (`windows/fileDialog/versionsDialog`), opened in the
 * package's modal over a made-up folder of towers that lives only on this
 * page. Every command answers at once and changes the folder in memory, so
 * the list, the questions and the notes all show; nothing is read or
 * written anywhere.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { showFileDialog, type FileDialogCtx } from "../lib/ui/fileDialog/fileDialog.js";
import type { FileEntry, FileKind, FileNote, FileWords } from "../lib/ui/fileDialog/fileDialogTypes.js";
import type { LinkedPlaceCtx } from "../lib/ui/fileDialog/fileDialogPlaces.js";
import { clockMark, oldTowerMark, towerMark } from "../lib/ui/fileDialog/fileIcons.js";
import { showVersionsDialog, type FileVersion } from "../lib/ui/fileDialog/versionsDialog.js";
import { ModalShell } from "../lib/ui/uiModal.js";

const WORDS: FileWords = {
  one: "tower",
  many: "towers",
  home: "My Towers",
  homeWhere: "in this browser",
  all: "All towers",
  noneInFolder: "There are no tower files (.vctower or .TDT) in that folder.",
  mirror: "Keep a copy of my towers here too",
  kept: "An autosave this version couldn't read is kept.",
};

const KINDS: readonly FileKind[] = [
  { id: "auto", label: "Auto-save", mark: clockMark },
  { id: "tower", label: "Tower", filter: "Tower (*.vctower)", mark: towerMark },
  { id: "tdt", label: "SimTower 1994", filter: "SimTower 1994 (*.TDT)", mark: oldTowerMark },
];

const NAME_MAX = 60;
/** A fixed "now", so the Modified column reads the same on every visit. */
const NOW = new Date(2026, 10, 20, 15, 30).getTime();
const HOUR = 60 * 60 * 1000;

const sample = (): FileEntry[] => [
  { id: "1", name: "Harbor Point", kind: "tower", size: 48 * 1024, modified: NOW - 2 * HOUR },
  { id: "2", name: "Skyline Plaza", kind: "tower", size: 212 * 1024, modified: NOW - 26 * HOUR },
  { id: "3", name: "Garden Court", kind: "tower", size: 9 * 1024, modified: NOW - 72 * HOUR },
  { id: "4", name: "OLDTOWER", kind: "tdt", size: 31 * 1024, modified: NOW - 900 * HOUR },
];

const clean = (name: string): string =>
  name
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX);
const same = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

/** The Open, Save As and Previous Versions buttons, and the dialog they
 *  open in. */
export function fileDialogDemo(): TemplateResult {
  let shell: ModalShell | null = null;
  let files = sample();
  let next = 10;
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((l) => l());
  const made = (el?: Element) => {
    if (el instanceof HTMLDialogElement && !shell)
      shell = new ModalShell(el, { gameStopped: () => false, toast: () => undefined });
  };
  const freeName = (name: string, taken: readonly FileEntry[]) => {
    for (let n = 1; ; n++) {
      const candidate = n === 1 ? name : `${name} (${n})`;
      if (!taken.some((f) => same(f.name, candidate))) return candidate;
    }
  };
  const write = (name: string, kind = "tower"): null => {
    files = [
      ...files.filter((f) => !same(f.name, name)),
      { id: String(next++), name, kind, size: 40 * 1024, modified: NOW },
    ];
    changed();
    return null;
  };
  const versionsOf = (name: string): FileVersion[] => [
    { key: "a", at: NOW - HOUR, size: 47 * 1024, how: "Saved by you" },
    { key: "b", at: NOW - 3 * HOUR, size: 45 * 1024, how: "Autosaved" },
    { key: "c", at: NOW - 30 * HOUR, size: 40 * 1024, how: name === "Harbor Point" ? "Original" : "Autosaved" },
  ];
  const versions = (id: string, back?: () => void) => {
    const file = files.find((f) => f.id === id);
    if (!shell || !file) return;
    showVersionsDialog(shell, {
      name: file.name,
      versions: versionsOf(file.name),
      mark: towerMark,
      intro: `Earlier versions of "${file.name}". Open one to make it a new tower file beside this one; the tower itself doesn't change.`,
      empty: "No earlier versions yet.",
      open: async (v) => {
        write(freeName(`${file.name} (${v.how})`, files));
        shell?.close();
        return null;
      },
      back,
    });
  };
  const ctx = (mode: FileDialogCtx["mode"]): FileDialogCtx => ({
    mode,
    words: WORDS,
    kinds: KINDS,
    saveKind: "tower",
    nameMax: NAME_MAX,
    cleanName: clean,
    freeName,
    folderFile: (name) => /\.(vctower|tdt)$/i.test(name),
    initialName: mode === "saveAs" ? "Harbor Point" : "",
    pinned: () =>
      mode === "open"
        ? { id: "auto", name: "Auto-save (Harbor Point)", kind: "auto", pinned: true, size: 47 * 1024, modified: NOW }
        : null,
    files: () => files,
    usage: () => ({ count: files.length, bytes: files.reduce((n, f) => n + f.size, 0) }),
    loading: () => false,
    onChange: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    open: () => undefined,
    save: async (name) => write(name),
    rename: async (id, name): Promise<FileNote | null> => {
      const was = clean(name);
      if (files.some((f) => f.id !== id && same(f.name, was)))
        return { text: `There's already a tower named "${was}".`, kind: "bad" };
      files = files.map((f) => (f.id === id ? { ...f, name: was } : f));
      changed();
      return null;
    },
    duplicate: async (id) => {
      const file = files.find((f) => f.id === id);
      return file ? write(freeName(`Copy of ${file.name}`, files), file.kind) : null;
    },
    remove: async (id) => {
      files = files.filter((f) => f.id !== id);
      changed();
      return null;
    },
    versions,
    add: async () => ({ text: "This sample folder keeps no files.", kind: "info" }),
    fromComputer: () => undefined,
    downloadKept: null,
  });
  const show = (mode: FileDialogCtx["mode"]) => {
    if (shell) showFileDialog(shell, ctx(mode));
  };
  // A linked folder the browser wants the player's OK for again, as after a
  // restart: the window opens on it and shows the Allow access… note.
  const linked = (): LinkedPlaceCtx => ({
    canLink: true,
    state: () => ({ name: "Towers", access: "prompt" }),
    files: () => [],
    usage: () => ({ count: 0, bytes: 0 }),
    onChange: () => () => {},
    refresh: async () => {},
    link: async () => "cancel",
    allow: async () => ({ text: "This sample folder can't be opened.", kind: "info" }),
    unlink: async () => null,
    mirror: () => false,
    setMirror: async () => null,
    open: () => undefined,
    save: async () => null,
    duplicate: async () => null,
  });
  const showLinked = () => {
    if (shell) showFileDialog(shell, { ...ctx("open"), linked: linked(), startIn: "linked" });
  };
  const reset = () => {
    files = sample();
    changed();
  };
  return html`<div class="g-row">
      <button type="button" class="btn" @click=${() => show("open")}>Open…</button>
      <button type="button" class="btn" @click=${() => show("saveAs")}>Save As…</button>
      <button type="button" class="btn" @click=${() => versions("1")}>Previous Versions…</button>
      <button type="button" class="btn" @click=${showLinked}>Open a linked folder…</button>
      <button type="button" class="btn" @click=${reset}>Put the sample folder back</button>
    </div>
    <dialog id="modal" ${ref(made)}></dialog>`;
}
