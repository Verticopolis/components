/**
 * Which categories of the Tools window the player folded, kept between
 * visits. Storage that is missing or throws reads as nothing folded, and a
 * failed write is dropped. The game names the key, so two games on one origin
 * keep their own.
 */

/** The class on a folded category's `.pal-group` section. */
export const PALETTE_FOLDED_CLASS = "pal-folded";

/** The categories folded under `key`, by title. */
export function loadFolded(key: string, storage: Pick<Storage, "getItem"> | null): Set<string> {
  try {
    const raw = storage?.getItem(key);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((t): t is string => typeof t === "string") : []);
  } catch {
    return new Set();
  }
}

/** Keep `folded` under `key`, sorted so the same set always writes the same text. */
export function saveFolded(key: string, folded: ReadonlySet<string>, storage: Pick<Storage, "setItem"> | null): void {
  try {
    storage?.setItem(key, JSON.stringify([...folded].sort()));
  } catch {
    // A full or blocked storage keeps the fold for this visit only.
  }
}
