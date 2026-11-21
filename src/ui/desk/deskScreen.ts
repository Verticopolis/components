import { TOUCH_DESK_MQ, TOUCH_MQ, type DeskScreen, type DeskSwitch } from "./deskPocket";
import { read, write, type Store } from "./deskStore";

/**
 * Reading the screen for `deskMode`: the media queries that decide which
 * desk a screen gets, and the testing switch in the address. The game's
 * rules are the defaults (owner, 2026-11-15 and 2026-11-20): the full desk on
 * a screen at least 1024 x 600 whose main input is a mouse or a trackpad, or
 * on a touchscreen that size; the pocket desk on a smaller touchscreen. A
 * page may name its own queries.
 *
 * The switch: `?desk=on` puts the full desk on any screen at least
 * tablet-wide, `?desk=pocket` the pocket desk on any screen, and `?desk=off`
 * no desk, each kept until the next. A page names the switch's parameter and
 * storage key, or leaves the switch out.
 *
 * Cost: a few media query matches and one storage read per decision.
 */

/** A computer with room for the desk: at least 1024 x 600, and a mouse or a
 *  trackpad as its main input (a touchscreen laptop included, a tablet with
 *  a pen not). */
export const DESK_MQ = "(min-width: 1024px) and (min-height: 600px) and (pointer: fine) and (hover: hover)";
/** The narrowest screen `?desk=on` puts the full desk on. */
export const DESK_ANY_SCREEN_MQ = "(min-width: 768px)";

/** The media queries behind each of {@link DeskScreen}'s facts. */
export interface DeskQueries {
  readonly computer: string;
  readonly wide: string;
  readonly touch: string;
  readonly roomy: string;
}

/** The game's queries. */
export const DESK_QUERIES: DeskQueries = {
  computer: DESK_MQ,
  wide: DESK_ANY_SCREEN_MQ,
  touch: TOUCH_MQ,
  roomy: TOUCH_DESK_MQ,
};

/** Where the testing switch is read and kept. */
export interface DeskSwitchPlace {
  readonly store: Store | null;
  /** The storage key ("vc-desk" in the game). */
  readonly key: string;
  /** The address parameter; "desk" when absent. */
  readonly param?: string;
}

/** What each address value keeps. */
const ASKED: Readonly<Record<string, Exclude<DeskSwitch, null>>> = { on: "any", pocket: "pocket", off: "off" };

/** The address's value for `param`, or null when it has none or does not
 *  parse (`URL.canParse` is too new for some phones the game runs on). */
function askedOf(href: string, param: string): string | null {
  try {
    return new URL(href).searchParams.get(param);
  } catch {
    return null;
  }
}

/** The switch kept now, or null. */
export function readDeskSwitch(place: DeskSwitchPlace): DeskSwitch {
  const kept = read(place.store, place.key);
  return kept === "any" || kept === "pocket" || kept === "off" ? kept : null;
}

/** Keep what the address asks of the switch, and answer the switch now. Any
 *  other address leaves it as it was. */
export function heedDeskSwitch(href: string, place: DeskSwitchPlace): DeskSwitch {
  const asked = askedOf(href, place.param ?? "desk");
  const keep = asked !== null && Object.prototype.hasOwnProperty.call(ASKED, asked) ? ASKED[asked] : null;
  if (keep) write(place.store, place.key, keep);
  return readDeskSwitch(place);
}

/** The screen now, for `deskMode`, with the switch `forced`. A window that
 *  cannot match media answers no to every query. */
export function deskScreenOf(win: Window, forced: DeskSwitch, queries: DeskQueries = DESK_QUERIES): DeskScreen {
  const matches = (q: string) => typeof win.matchMedia === "function" && win.matchMedia(q).matches;
  return {
    forced,
    computer: matches(queries.computer),
    wide: matches(queries.wide),
    touch: matches(queries.touch),
    roomy: matches(queries.roomy),
  };
}

/** Hear any of the queries change (a window resized, a tablet turned, a
 *  mouse plugged in); the answer stops hearing. */
export function watchDeskScreen(win: Window, heard: () => void, queries: DeskQueries = DESK_QUERIES): () => void {
  if (typeof win.matchMedia !== "function") return () => {};
  const lists = [...new Set(Object.values(queries))].map((q) => win.matchMedia(q));
  for (const l of lists) l.addEventListener("change", heard);
  return () => {
    for (const l of lists) l.removeEventListener("change", heard);
  };
}
