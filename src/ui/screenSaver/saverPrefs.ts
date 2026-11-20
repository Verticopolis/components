/**
 * The screen saver choices: which saver, how long a wait, and whether it also
 * shows on the way back to the tab. A page keeps them in its own storage,
 * under a key it names, never in anything it saves for the player.
 */

/** The savers, in the order the dialog lists them. */
export const SAVERS = ["night", "stars", "express", "endless", "marquee"] as const;
export type SaverId = (typeof SAVERS)[number];

/** Each saver's name as the dialog lists it. */
export const SAVER_NAMES: Readonly<Record<SaverId, string>> = {
  night: "Night Shift",
  stars: "Skyline Starfield",
  express: "Express Elevators",
  endless: "Endless Tower",
  marquee: "Bulletin Marquee",
};

/** The choice that turns the saver off. */
export const NO_SAVER = "none";
export type SaverChoice = SaverId | typeof NO_SAVER;

/** The waits the dialog offers, in minutes. */
export const WAIT_MINUTES = [1, 3, 5, 10, 15] as const;

export interface SaverPrefs {
  /** Which saver runs, or none. */
  saver: SaverChoice;
  /** Minutes of a paused, untouched page before it starts, and the least
   *  time away from the tab that brings it up on the way back. */
  waitMinutes: number;
  /** Show it when the player comes back to the tab after the wait. */
  onReturn: boolean;
}

/** The defaults: Night Shift after 5 minutes; on the way back to the tab on
 *  a computer, never on a touch screen, which locks and unlocks all day. */
export function defaultSaverPrefs(touchScreen: boolean): SaverPrefs {
  return { saver: "night", waitMinutes: 5, onReturn: !touchScreen };
}

function isChoice(v: unknown): v is SaverChoice {
  return v === NO_SAVER || (SAVERS as readonly unknown[]).includes(v);
}

/** The choices kept under `key`, field by field: a missing or foreign field,
 *  or unreadable or blocked storage, reads as its default. */
export function loadSaverPrefs(
  key: string,
  touchScreen: boolean,
  storage: Pick<Storage, "getItem"> | null = safeStorage(),
): SaverPrefs {
  const out = defaultSaverPrefs(touchScreen);
  try {
    const raw = storage?.getItem(key);
    if (!raw) return out;
    const p = JSON.parse(raw) as Partial<Record<keyof SaverPrefs, unknown>>;
    if (isChoice(p.saver)) out.saver = p.saver;
    if ((WAIT_MINUTES as readonly unknown[]).includes(p.waitMinutes)) out.waitMinutes = p.waitMinutes as number;
    if (typeof p.onReturn === "boolean") out.onReturn = p.onReturn;
  } catch {
    /* unreadable or blocked storage: the defaults */
  }
  return out;
}

/** Keep `p` under `key`. A full or blocked storage is ignored: the choices
 *  then hold for this visit. */
export function saveSaverPrefs(
  key: string,
  p: SaverPrefs,
  storage: Pick<Storage, "setItem"> | null = safeStorage(),
): void {
  try {
    storage?.setItem(key, JSON.stringify(p));
  } catch {
    /* a full or blocked storage: the choice holds for this visit */
  }
}

function safeStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
