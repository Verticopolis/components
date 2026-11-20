import type { FileDialogView } from "./fileDialogTemplate";
import type { FileEntry, FileFilter, FileKind, FileRow, FileSortKey } from "./fileDialogTypes";

/** The rows the Open and Save As windows list (`fileDialog.ts`). */

/** The window's file count and size, with the pinned row (the Auto-save)
 *  when it is listed, so the header counts every file the window shows. */
export function withPinned(
  usage: { count: number; bytes: number },
  pinned: FileRow | null,
): { count: number; bytes: number } {
  return pinned ? { count: usage.count + 1, bytes: usage.bytes + (pinned.size ?? 0) } : usage;
}

/** The rows a window shows: the pinned row first, then the files that pass
 *  the filter, in the chosen order. The Type column sorts by the order of
 *  `kinds`. */
export function fileRows(
  pinned: FileRow | null,
  files: readonly FileEntry[],
  kinds: readonly FileKind[],
  filter: FileFilter,
  sort: FileDialogView["sort"],
): FileRow[] {
  const rows: FileRow[] = files
    .filter((f) => filter === "all" || f.kind === filter)
    .map((f) => ({ id: f.id, name: f.name, kind: f.kind, size: f.size, modified: f.modified }));
  const order = (kind: string) => {
    const at = kinds.findIndex((k) => k.id === kind);
    return at < 0 ? kinds.length : at;
  };
  const by: Record<FileSortKey, (a: FileRow, b: FileRow) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }),
    type: (a, b) => order(a.kind) - order(b.kind),
    size: (a, b) => (a.size ?? 0) - (b.size ?? 0),
    modified: (a, b) => (a.modified ?? 0) - (b.modified ?? 0),
  };
  rows.sort((a, b) => (sort.down ? -1 : 1) * by[sort.key](a, b) || by.name(a, b));
  return pinned && filter === "all" ? [pinned, ...rows] : rows;
}
