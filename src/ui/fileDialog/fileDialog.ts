import "../../styles/game/file-dialog.css";
import type { ModalShell } from "../uiModal";
import type { FileDialogCtx, FileDialogResume } from "./fileDialogCtx";
import { lastPlace, placeHandlers, rememberPlace, whereWords } from "./fileDialogPlaces";
import { rowPress } from "./fileDialogPress";
import { fileRows, withPinned } from "./fileDialogRows";
import {
  fileDialogTemplate,
  rowDomId,
  type FileAnswer,
  type FileAsk,
  type FileDialogHandlers,
  type FileDialogView,
} from "./fileDialogTemplate";
import type { FileEntry, FileFilter, FileNote, FilePlace, FileRow, FileSortKey } from "./fileDialogTypes";

export type { FileDialogCtx, FileDialogResume } from "./fileDialogCtx";
export type { LinkedFolderState, LinkedPlaceCtx } from "./fileDialogPlaces";

/**
 * The controller for the Open and Save As windows (`fileDialogTemplate.ts`),
 * drawn in a `ModalShell`. It keeps the window's state (the selection, the
 * typed name, the filter and sort, a question asked in place, a rename under
 * way) and draws the body again on each change, and on each change to the
 * folder while it is open. What a command does to a folder or a file, the
 * rules for a file's name, and the words for the files are the caller's
 * (`FileDialogCtx`), so this file holds no storage.
 *
 * Keys in the list: arrows, Home and End move; Enter opens or saves; F2
 * renames; Delete deletes; Ctrl+C and Ctrl+V copy and paste a file (the
 * paste is a copy beside it); the context menu key or Shift+F10 opens the
 * right-click menu, as does a finger held on a row. Files dropped on the
 * window are added to the home folder.
 */

/** The file Copy put on the clipboard, by id. Kept between openings, as a
 *  desktop's clipboard is. */
let copied: string | null = null;

/** Forget the clipboard, for tests. */
export function clearFileClipboardForTests(): void {
  copied = null;
}

/** Whether a drag carries files from the device. */
const carriesFiles = (e: DragEvent): boolean => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");

/** Open the Open or Save As window in `shell`. */
export function showFileDialog(shell: ModalShell, ctx: FileDialogCtx, resume?: FileDialogResume): void {
  const opening = ctx.mode === "open";
  const words = ctx.words;
  const title = opening ? "Open" : "Save As";
  const state = {
    selected: resume?.selected ?? null,
    name: resume?.name ?? ctx.initialName,
    filter: resume?.filter ?? ("all" as FileFilter),
    sort: resume?.sort ?? { key: "modified" as FileSortKey, down: true },
    line: null as FileNote | null,
    ask: null as FileAsk | null,
    renaming: null as string | null,
    menu: null as FileDialogView["menu"],
    busy: false,
    dropping: false,
    place: (resume?.place ?? ctx.startIn ?? lastPlace()) as FilePlace,
    look: false,
  };
  const linked = ctx.linked ?? null;
  /** The list shows the linked folder (one is linked and chosen). */
  const inLinked = (): boolean => state.place === "linked" && !!linked?.state();
  const placeFiles = (): readonly FileEntry[] => (inLinked() ? linked!.files() : ctx.files());
  const allowed = (): boolean => !inLinked() || linked!.state()?.access === "granted";
  const placeName = (): string => (inLinked() ? `"${linked!.state()!.name}"` : words.home);
  const same = (a: string, b: string): boolean => a.toLocaleLowerCase() === b.toLocaleLowerCase();
  /** The window's box once open; null before, and detached once closed or
   *  replaced by another window. */
  let box: HTMLElement | null = null;
  const open = (): boolean => !!box?.isConnected;
  let rows: FileRow[] = [];

  const rowOf = (id: string | null) => rows.find((r) => r.id === id) ?? null;
  const fileOf = (id: string | null) => {
    const r = rowOf(id);
    return r && !r.pinned ? r : null;
  };
  const find = <T extends HTMLElement>(selector: string): T | null => box?.querySelector<T>(selector) ?? null;

  function body() {
    const here = inLinked();
    const pinned = opening && !here ? ctx.pinned() : null;
    rows = fileRows(pinned, placeFiles(), ctx.kinds, state.filter, state.sort);
    if (state.selected !== null && !rowOf(state.selected)) state.selected = null;
    const folder = linked?.state() ?? null;
    const view: FileDialogView = {
      ...state,
      mode: ctx.mode,
      words,
      kinds: ctx.kinds,
      saveKind: ctx.saveKind,
      nameMax: ctx.nameMax,
      rows,
      usage: here ? linked!.usage() : withPinned(ctx.usage(), pinned),
      loading: !here && ctx.loading(),
      canPaste: copied !== null,
      canVersions: !!ctx.versions,
      kept: ctx.downloadKept !== null,
      place: here ? "linked" : "local",
      linked: folder ? { name: folder.name, allowed: folder.access === "granted", mirror: linked!.mirror() } : null,
      canLink: !!linked?.canLink,
      canPickFolder: !!ctx.canPickFolder,
      where: whereWords(),
      lookOpen: state.look,
    };
    return fileDialogTemplate(view, handlers);
  }

  function draw(): void {
    if (!open()) {
      off();
      return;
    }
    shell.render({ title, body: body() });
  }
  let offFiles = (): void => {};
  let offLinked = (): void => {};
  const off = () => {
    offFiles();
    offLinked();
  };

  function set(change: Partial<typeof state>): void {
    Object.assign(state, change);
    draw();
  }

  /** Run a folder command with the buttons grayed, then show its note. */
  async function run(command: () => Promise<FileNote | null>): Promise<FileNote | null> {
    set({ busy: true, line: null, menu: null });
    let note: FileNote | null;
    try {
      note = await command();
    } catch (err) {
      note = { text: err instanceof Error ? err.message : String(err), kind: "bad" };
    }
    if (open()) set({ busy: false, line: note });
    return note;
  }

  function select(id: string): void {
    const r = rowOf(id);
    if (!r) return;
    set({ selected: id, name: r.name, menu: null, line: null });
    find(`#${rowDomId(id)}`)?.scrollIntoView?.({ block: "nearest" });
  }

  function activate(id: string): void {
    const r = rowOf(id);
    if (!r) return;
    if (opening) {
      shell.close();
      if (inLinked()) linked!.open(r);
      else ctx.open(r);
      return;
    }
    if (r.pinned) return;
    set({ selected: id, name: r.name });
    primary();
  }

  function primary(): void {
    // Not before the list is in: a name check against half a list could
    // save over a file without asking.
    if (state.busy || state.ask || (!inLinked() && ctx.loading()) || !allowed()) return;
    const name = ctx.cleanName(state.name);
    if (!name) {
      set({ line: { text: `Type a name for the ${words.one}.`, kind: "bad" } });
      return;
    }
    const match = rows.find((r) => same(r.name, name));
    if (opening) {
      if (match) activate(match.id);
      else set({ line: { text: `There's no ${words.one} named "${name}" in ${placeName()}.`, kind: "bad" } });
      return;
    }
    // Saving writes the save kind, so in the linked folder only another
    // file of that kind is replaced; a file of another kind beside it stays.
    const files = placeFiles().filter((f) => !inLinked() || f.kind === ctx.saveKind);
    if (files.some((f) => same(f.name, name))) ask({ kind: "replace", name, alt: ctx.freeName(name, files) });
    else void save(name, false);
  }

  async function save(name: string, replace: boolean): Promise<void> {
    const note = await run(() => (inLinked() ? linked!.save(name, replace) : ctx.save(name, replace)));
    if (note === null && open()) shell.close();
  }

  /** Put a question in its message box, with the focus on the numbered
   *  name where there is one, else on No: both questions guard a step that
   *  can't be taken back. */
  function ask(question: FileAsk): void {
    set({ ask: question, menu: null });
    find(question.alt ? '[data-fd-ask="alt"]' : '[data-fd-ask="no"]')?.focus();
    ctx.asked?.(question.kind);
  }

  function answer(choice: FileAnswer): void {
    const asked = state.ask;
    set({ ask: null });
    if (choice === "no" || !asked) {
      focusAfterAsk(asked);
      return;
    }
    if (asked.kind === "replace")
      void (choice === "alt" && asked.alt ? save(asked.alt, false) : save(asked.name, true));
    else {
      const target = fileOf(state.selected);
      if (target) void run(() => ctx.remove(target.id));
    }
  }

  function startRename(): void {
    const target = fileOf(state.selected);
    // A file on the player's computer is never renamed.
    if (!target || state.busy || inLinked()) return;
    set({ renaming: target.id, menu: null, line: null });
    const input = find<HTMLInputElement>(".fd-rename");
    input?.focus();
    input?.select();
  }

  function renameDone(value: string | null): void {
    const id = state.renaming;
    if (id === null) return;
    set({ renaming: null });
    focusList();
    const was = rowOf(id);
    if (value === null || !was || ctx.cleanName(value) === was.name) return;
    void run(() => ctx.rename(id, value)).then((note) => {
      if (note === null && open()) set({ name: ctx.cleanName(value) });
    });
  }

  function remove(): void {
    const target = fileOf(state.selected);
    // Nor deleted.
    if (target && !state.busy && !inLinked()) ask({ kind: "delete", name: target.name });
  }

  function copy(): void {
    const target = fileOf(state.selected);
    if (!target || inLinked()) return;
    copied = target.id;
    set({ line: { text: `Copied "${target.name}". Paste makes a copy of it here.`, kind: "info" }, menu: null });
  }

  function paste(): void {
    const id = copied;
    if (id === null || state.busy || inLinked()) return;
    if (!ctx.files().some((f) => f.id === id)) {
      copied = null;
      set({ line: { text: `The ${words.one} you copied has been deleted.`, kind: "bad" } });
      return;
    }
    void run(() => ctx.duplicate(id));
  }

  function duplicate(): void {
    const target = fileOf(state.selected);
    if (target && !state.busy) void run(() => (inLinked() ? linked!.duplicate(target.id) : ctx.duplicate(target.id)));
  }

  function versions(): void {
    const target = fileOf(state.selected);
    if (target?.kind !== ctx.saveKind || inLinked() || !ctx.versions) return;
    const { selected, name, filter, sort, place } = state;
    const scroll = find(".fd-rows")?.scrollTop ?? 0;
    ctx.versions(target.id, () => showFileDialog(shell, ctx, { selected, name, filter, sort, place, scroll }));
  }

  function focusList(): void {
    find(".fd-rows")?.focus();
  }

  /** Back where the question came from once it is dropped: the File name box
   *  after Save As asked about a name, else the list. */
  function focusAfterAsk(asked: FileAsk | null): void {
    if (asked?.kind === "replace") find("#fd-name")?.focus();
    else focusList();
  }

  function listKey(e: KeyboardEvent): void {
    const at = rows.findIndex((r) => r.id === state.selected);
    const move = (i: number) => {
      e.preventDefault();
      const r = rows[Math.max(0, Math.min(rows.length - 1, i))];
      if (r) select(r.id);
    };
    const ctrl = e.ctrlKey || e.metaKey;
    if (e.key === "ArrowDown") move(at + 1);
    else if (e.key === "ArrowUp") move(at < 0 ? 0 : at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(rows.length - 1);
    else if (e.key === "Enter" && state.selected) {
      e.preventDefault();
      activate(state.selected);
    } else if (e.key === "F2") {
      e.preventDefault();
      startRename();
    } else if (e.key === "Delete") {
      e.preventDefault();
      remove();
    } else if (ctrl && e.key.toLowerCase() === "c") {
      e.preventDefault();
      copy();
    } else if (ctrl && e.key.toLowerCase() === "v") {
      e.preventDefault();
      paste();
    } else if ((e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) && state.selected) {
      e.preventDefault();
      const rect = find(`#${rowDomId(state.selected)}`)?.getBoundingClientRect();
      openMenu(state.selected, rect ? rect.left + 24 : 0, rect ? rect.bottom : 0);
      handlers.press.key();
    }
  }

  /** Esc closes what is open inside the window before the window itself, and
   *  Tab stays inside a message box until it is answered. */
  function windowKey(e: KeyboardEvent): void {
    if (e.key === "Tab" && state.ask) {
      e.preventDefault();
      const buttons = [...(box?.querySelectorAll<HTMLElement>(".fd-ask .btn") ?? [])];
      const at = buttons.indexOf(document.activeElement as HTMLElement);
      buttons[(at + (e.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
      return;
    }
    if (e.key !== "Escape" || !(state.menu || state.ask || state.look)) return;
    e.preventDefault();
    e.stopPropagation();
    const asked = state.ask;
    const looking = state.look && !asked;
    set({ menu: null, ask: null, look: false });
    if (looking) find(".fd-look")?.focus();
    else focusAfterAsk(asked);
  }

  /** The right-click menu at (x, y) on the screen, kept inside the window:
   *  a press near the right or bottom edge (a phone's long-press) opens it
   *  to the left of or above the finger instead of off the edge. */
  function openMenu(id: string, x: number, y: number): void {
    const frame = (find(".fd") ?? box)?.getBoundingClientRect();
    if (!frame) return;
    set({ selected: id, name: rowOf(id)?.name ?? state.name, menu: { id, x: x - frame.left, y: y - frame.top } });
    const menu = find(".fd-menu");
    if (menu) {
      const inside = (at: number, size: number, room: number) => Math.max(0, Math.min(at, room - size));
      const kept = {
        id,
        x: inside(x - frame.left, menu.offsetWidth, frame.width),
        y: inside(y - frame.top, menu.offsetHeight, frame.height),
      };
      if (kept.x !== state.menu?.x || kept.y !== state.menu?.y) set({ menu: kept });
    }
    find(".fd-menu .mb-item")?.focus();
  }

  /** Add `files` to the home folder, and show the home folder. */
  function add(files: readonly File[], how: "drop" | "folder"): void {
    void run(() => ctx.add(files, how)).then(() => set({ place: "local" }));
  }

  const handlers: FileDialogHandlers = {
    select,
    activate,
    name: (value: string) => {
      const r = rowOf(state.selected);
      set({ name: value, selected: r && r.name === value ? r.id : null, line: null });
    },
    filter: (value: FileFilter) => set({ filter: value }),
    sort: (key: FileSortKey) =>
      set({ sort: { key, down: state.sort.key === key ? !state.sort.down : key === "modified" } }),
    primary,
    cancel: () => shell.close(),
    rename: startRename,
    renameDone,
    copy,
    paste,
    duplicate,
    remove,
    versions,
    answer,
    openMenu,
    press: rowPress(openMenu, (how) => ctx.menuOpened?.(how)),
    closeMenu: () => {
      if (state.menu || state.look) set({ menu: null, look: false });
    },
    listKey,
    windowKey,
    drag: {
      enter: (e) => {
        if (!carriesFiles(e)) return;
        e.preventDefault();
        if (!state.dropping) set({ dropping: true });
      },
      over: (e) => {
        if (!carriesFiles(e)) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      },
      leave: (e) => {
        const into = e.relatedTarget;
        if (state.dropping && !(into instanceof Node && (e.currentTarget as Node).contains(into)))
          set({ dropping: false });
      },
      drop: (e) => {
        if (!carriesFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        set({ dropping: false });
        const files = Array.from(e.dataTransfer?.files ?? []);
        // Dropped files go to the home folder, so the list shows them there.
        if (files.length > 0) add(files, "drop");
      },
    },
    fromComputer: () => {
      shell.close();
      ctx.fromComputer();
    },
    downloadKept: () => {
      shell.close();
      ctx.downloadKept?.();
    },
    fromFolder: () => find<HTMLInputElement>(".fd-folder-input")?.click(),
    folderPicked: (picked) => {
      if (!open()) return;
      const files = picked.filter((f) => ctx.folderFile(f.name));
      if (files.length === 0) set({ line: { text: words.noneInFolder, kind: "bad" } });
      else add(files, "folder");
    },
    allow: () => void run(() => linked!.allow()),
    places: placeHandlers({
      state: () => state,
      set,
      linked,
      run,
      find: (selector) => [...(box?.querySelectorAll<HTMLElement>(selector) ?? [])],
      focusList,
      remember: rememberPlace,
    }),
  };

  box = shell.open({ title, body: body() }, { displaceable: opening });
  offFiles = ctx.onChange(draw);
  offLinked = linked?.onChange(draw) ?? (() => {});
  // The folder is read back only when a window shows it, and its files may
  // have changed on disk since it was last read.
  if (inLinked()) void linked!.refresh().catch(() => {});
  if (resume) {
    // Back from a child window: the list where it was, the row in focus.
    const list = find(".fd-rows");
    if (list) list.scrollTop = resume.scroll;
    focusList();
  } else if (opening) focusList();
  else {
    const input = find<HTMLInputElement>("#fd-name");
    input?.focus();
    input?.select();
  }
}
