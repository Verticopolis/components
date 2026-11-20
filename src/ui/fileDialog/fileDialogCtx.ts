import type { LinkedPlaceCtx } from "./fileDialogPlaces";
import type { FileMenuHow } from "./fileDialogPress";
import type { FileAsk, FileDialogView } from "./fileDialogTemplate";
import type {
  FileDialogMode,
  FileEntry,
  FileFilter,
  FileKind,
  FileNote,
  FilePlace,
  FileRow,
  FileWords,
} from "./fileDialogTypes";

/** What the Open and Save As windows (`fileDialog.ts`) are given: the
 *  caller's words and kinds, its name rules, its folder and its commands. */
export interface FileDialogCtx {
  readonly mode: FileDialogMode;
  readonly words: FileWords;
  /** The kinds of file, in the order the Type column sorts them. */
  readonly kinds: readonly FileKind[];
  /** The kind Save As writes. In the linked folder, Save As replaces only a
   *  file of this kind, and Previous versions… is offered for this kind. */
  readonly saveKind: string;
  /** The longest name the File name and rename boxes take. */
  readonly nameMax: number;
  /** A typed name as a file may carry it (characters a disk refuses taken
   *  out, spaces squeezed, cut to length); "" when nothing is left. */
  cleanName(name: string): string;
  /** `name`, or the first numbered name ("Sky (2)") no file in `files` has. */
  freeName(name: string, files: readonly FileEntry[]): string;
  /** Whether From a folder… takes a picked file of this name. */
  folderFile(name: string): boolean;
  /** The name the File name box starts with. */
  readonly initialName: string;
  /** The pinned row (the Auto-save, Open only), or null when there is none. */
  pinned(): FileRow | null;
  files(): readonly FileEntry[];
  usage(): { count: number; bytes: number };
  /** True while the home folder is still opening; the list fills in when
   *  it is done. */
  loading(): boolean;
  onChange(listener: () => void): () => void;
  /** Open a row. The window is closed before this runs, since an import may
   *  open a window of its own. */
  open(row: FileRow): void;
  /** Save as `name`. `replace` is true once the window has asked about a
   *  file of that name; false refuses one that appeared meanwhile. Null once
   *  saved; the window then closes. */
  save(name: string, replace: boolean): Promise<FileNote | null>;
  rename(id: string, name: string): Promise<FileNote | null>;
  duplicate(id: string): Promise<FileNote | null>;
  remove(id: string): Promise<FileNote | null>;
  /** Show a file's Previous Versions window (`versionsDialog.ts`). Its
   *  Cancel calls `back`, which puts this window back as the player left it. */
  versions?(id: string, back: () => void): void;
  /** Files dropped on the window (`drop`), or those of a folder the player
   *  picked with From a folder… (`folder`), added to the home folder. */
  add(files: readonly File[], how?: "drop" | "folder"): Promise<FileNote | null>;
  /** The folder linked on the player's computer, where the browser can link
   *  one; null where it can't. */
  linked?: LinkedPlaceCtx | null;
  /** Where linking is not possible: offer From a folder…, which copies a
   *  picked folder's files into the home folder once. */
  canPickFolder?: boolean;
  /** The place the window starts in, when the caller knows better than the
   *  last one the player looked in. */
  startIn?: FilePlace;
  /** The window asked before replacing or deleting a file (to count it). */
  asked?(kind: FileAsk["kind"]): void;
  /** A row's right-click menu opened, and how (to count it). */
  menuOpened?(how: FileMenuHow): void;
  /** The way to or from a file on the device. The window is closed first. */
  fromComputer(): void;
  /** Download the autosave the game couldn't read, when one is kept (Open
   *  only; `words.kept` says so). The window is closed first, so a failure
   *  is seen. */
  downloadKept: (() => void) | null;
}

/** Where the player left a window that opened a child window (Previous
 *  versions…), so closing the child puts it back as it was, as in Windows. */
export interface FileDialogResume {
  readonly selected: string | null;
  readonly name: string;
  readonly filter: FileFilter;
  readonly sort: FileDialogView["sort"];
  readonly place: FilePlace;
  /** How far the list was scrolled. */
  readonly scroll: number;
}
