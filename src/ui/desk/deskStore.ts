/**
 * The desk's storage: reads and writes that never throw, so a full quota, a
 * blocked origin or no storage at all leaves the desk working for this visit.
 */

/** What the desk needs of a storage: `localStorage` fits, and so does a page's own. */
export type Store = Pick<Storage, "getItem" | "setItem">;

/** The value under `key`, or null when there is none or the store refuses. */
export function read(store: Store | null, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Keep `value` under `key`; a store that refuses keeps nothing, quietly. */
export function write(store: Store | null, key: string, value: string): void {
  try {
    store?.setItem(key, value);
  } catch {
    // A full quota or a blocked origin: the desk still works for this visit.
  }
}

/** The page's `localStorage`, or null where reading it throws (a blocked
 *  origin, a sandboxed frame). */
export function localStore(win: Window): Store | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}
