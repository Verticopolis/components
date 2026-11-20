import type { SVGTemplateResult } from "lit-html";

/**
 * The words and kinds of file the Open and Save As windows
 * (`fileDialog.ts`) are given. The windows know nothing of what a file
 * holds: a game names its files ("tower", "My Towers"), lists its kinds
 * (each with a Type column label, a type list entry and an icon mark) and
 * says which kind Save As writes.
 */

export type FileDialogMode = "open" | "saveAs";
export type FileSortKey = "name" | "type" | "size" | "modified";
/** `"all"`, or the id of a kind with a type list entry. */
export type FileFilter = string;

/** A kind of file the windows list. */
export interface FileKind {
  readonly id: string;
  /** The Type column's word: "Tower". */
  readonly label: string;
  /** Its entry in the type list: "Tower (*.vctower)". A kind without one
   *  (the Auto-save) is never offered there. */
  readonly filter?: string;
  /** What its file icon shows on the page (`fileIcons.ts`). */
  readonly mark: SVGTemplateResult;
}

/** The game's words for its files, put into the windows' sentences. */
export interface FileWords {
  /** One file, in a sentence: "tower". */
  readonly one: string;
  /** More than one: "towers". */
  readonly many: string;
  /** The folder kept in the browser: "My Towers". */
  readonly home: string;
  /** Where that folder is, under its name: "in this browser". */
  readonly homeWhere: string;
  /** The type list's first entry: "All towers". */
  readonly all: string;
  /** Said when a folder picked with From a folder… holds no file the
   *  windows take: "There are no tower files (.vctower or .TDT) in that
   *  folder." */
  readonly noneInFolder: string;
  /** The linked folder's check item that keeps a copy of the Auto-save
   *  there: "Keep a copy of my towers here too". */
  readonly mirror: string;
  /** The Open window's note above Download it, when an autosave the game
   *  couldn't read is kept. */
  readonly kept: string;
}

/** A file in a folder, as the caller lists it. */
export interface FileEntry {
  readonly id: string;
  readonly name: string;
  /** A {@link FileKind}'s id. */
  readonly kind: string;
  /** Its size in bytes. */
  readonly size: number;
  /** When it was last written, in milliseconds since 1970. */
  readonly modified: number;
}

/** One row of the list: a file, or a pinned row (the Auto-save). */
export interface FileRow {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly size?: number;
  readonly modified?: number;
  /** Listed first, opened only: never renamed, copied, duplicated or
   *  deleted, and named without its type. */
  readonly pinned?: boolean;
}

/** A line the window shows under its fields. */
export interface FileNote {
  readonly text: string;
  readonly kind: "bad" | "info";
}

/** Where a window's list comes from: the home folder, or the folder linked
 *  on the player's computer. */
export type FilePlace = "local" | "linked";
