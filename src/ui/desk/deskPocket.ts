import { html } from "lit-html";
import { renderDetached } from "../detached";

/**
 * The desk on touch screens (the owner's pick, 2026-11-20: "Pocket desk").
 *
 * A touchscreen at least 1024 px wide and 600 px tall (a sideways tablet,
 * or a 12.9 inch iPad held upright) has room for the full desk, so it gets
 * it, with touch chrome (a 44 px taskbar and menu rows, 44 px touch areas on
 * the title-bar buttons). A phone, held either way, and a smaller upright
 * tablet get the pocket desk: the tower window fills the screen with Info and Tools inside it, and
 * the Map floats over the tower at the size it has on phones, so the minimap
 * and the tower always show together. The Bulletin, Tower Info and the
 * Control Panel open over the whole desk, one at a time, as on a 1990s
 * handheld PC. The look is `styles/game/desk-pocket.css`; a game decides
 * the mode with `deskMode` and moves its own elements into `pocketBody`.
 */

/** The class on `<body>` while the desk is up on a touchscreen. */
export const DESK_TOUCH_CLASS = "desk-touch";
/** The class on `<body>` while the pocket desk is up. */
export const DESK_POCKET_CLASS = "desk-pocket";
/** The class of the grid inside the pocket tower window. */
export const POCKET_BODY_CLASS = "desk-pocket-body";

/** A touchscreen: the main pointer is a finger. */
export const TOUCH_MQ = "(pointer: coarse)";
/** Room for the full desk on a touchscreen: at least 1024 by 600 px, a
 *  sideways tablet or a 12.9 inch iPad held upright. */
export const TOUCH_DESK_MQ = "(min-width: 1024px) and (min-height: 600px)";

/** Which desk shows: the full desk, the pocket desk, or none (the game's
 *  own layout). */
export type DeskMode = "desk" | "pocket" | null;

/** A testing switch: the full desk on any screen at least tablet-wide
 *  (`any`), the pocket desk on any screen (`pocket`), no desk (`off`), or
 *  none set. */
export type DeskSwitch = "any" | "pocket" | "off" | null;

/** What decides the desk's mode. */
export interface DeskScreen {
  /** The switch the tester last set. */
  readonly forced: DeskSwitch;
  /** A computer screen with room for the desk (a mouse, and enough size). */
  readonly computer: boolean;
  /** At least tablet-wide. */
  readonly wide: boolean;
  /** A touchscreen: `TOUCH_MQ`. */
  readonly touch: boolean;
  /** A touchscreen with room for the full desk: `TOUCH_DESK_MQ`. */
  readonly roomy: boolean;
}

/** The desk this screen gets. */
export function deskMode(s: DeskScreen): DeskMode {
  if (s.forced === "off") return null;
  if (s.forced === "pocket") return "pocket";
  if (s.computer || (s.forced === "any" && s.wide)) return "desk";
  if (s.touch) return s.roomy ? "desk" : "pocket";
  return null;
}

/** The pocket grid. A game moves Info, Tools and the tower into it, in this
 *  order, and the stylesheet places them by screen shape. */
export function pocketBody(doc: Document): HTMLElement {
  const [grid] = renderDetached(doc, html`<div class=${POCKET_BODY_CLASS}></div>`).elements;
  return grid as HTMLElement;
}
