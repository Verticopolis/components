/**
 * The appearance schemes: how the windows, menus and buttons look. Each
 * scheme is one value of `html[data-scheme]`, which the scheme stylesheets
 * (`styles/schemes/*.css`, `retro-tokens.css`, `starlight-schemes.css`) key
 * on. Standard, the default, sets no attribute at all, so a page that never
 * picks a scheme needs nothing.
 *
 * This module holds data and two small writes, with no lit and no
 * stylesheet, so a site's config (run in Node) can import it as well as a
 * page. The dialog that picks a scheme is `windows/appearance`.
 *
 * Cost: nothing runs until a caller asks. A swap is one attribute on the
 * root element, so it costs a style recalculation and nothing else.
 */

/** The schemes, in the order the Appearance dialog and a site menu list them. */
export const SCHEMES = ["standard", "skyline", "high_contrast"] as const;
export type SchemeId = (typeof SCHEMES)[number];

/** The scheme every page starts in. */
export const DEFAULT_SCHEME: SchemeId = "standard";

/** Each scheme's name as a dialog or a menu shows it. */
export const SCHEME_NAMES: Readonly<Record<SchemeId, string>> = {
  standard: "Standard",
  skyline: "Skyline",
  high_contrast: "High Contrast",
};

/** The attribute on the root element the scheme stylesheets key on. */
export const SCHEME_ATTRIBUTE = "data-scheme";

export function isScheme(v: unknown): v is SchemeId {
  return (SCHEMES as readonly unknown[]).includes(v);
}

/** Dress the page in `id`: one attribute on `root` (normally `<html>`), and
 *  none for Standard. */
export function applyScheme(id: SchemeId, root: Element): void {
  if (id === DEFAULT_SCHEME) root.removeAttribute(SCHEME_ATTRIBUTE);
  else root.setAttribute(SCHEME_ATTRIBUTE, id);
}

/** The scheme `root` wears now: Standard when it has no scheme attribute or
 *  one this package does not know. */
export function schemeOf(root: Element): SchemeId {
  const value = root.getAttribute(SCHEME_ATTRIBUTE);
  return isScheme(value) ? value : DEFAULT_SCHEME;
}

/** The scheme kept under `key`, or Standard when there is none, it is not a
 *  scheme, or the storage is missing or blocked. */
export function loadScheme(key: string, storage: Pick<Storage, "getItem"> | null = safeStorage()): SchemeId {
  try {
    const raw = storage?.getItem(key);
    return isScheme(raw) ? raw : DEFAULT_SCHEME;
  } catch {
    return DEFAULT_SCHEME;
  }
}

/** Keep `id` under `key`. A full or blocked storage is ignored: the pick
 *  then lasts for this visit. */
export function saveScheme(key: string, id: SchemeId, storage: Pick<Storage, "setItem"> | null = safeStorage()): void {
  try {
    storage?.setItem(key, id);
  } catch {
    // The pick lasts for this visit.
  }
}

function safeStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
