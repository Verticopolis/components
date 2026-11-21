/**
 * A mouse or pen press held on the world while the overview MAP window is on
 * screen (#343): the window and its Map button let pointers through until it
 * is released, so a world drag released over either still ends on the world
 * canvas. A touch needs none, since the browser keeps a touch on the element
 * it pressed.
 */
import { noButtonHeld } from "./overviewMapInput";

/** The class the window and its button wear while a world press is held (the
 *  CSS lets such pointers through). The window's template draws it from
 *  `held`. */
export const WORLD_PRESS_CLASS = "world-press";

export class WorldPress {
  private on = false;
  /** Listened to only while a press is held: a mouse or pen move with no
   *  button down means its release was lost (let go outside the page). */
  private readonly onMove = (e: PointerEvent) => {
    if (e.pointerType !== "touch" && noButtonHeld(e)) this.set(false);
  };

  /** `changed` draws the window and its button with or without the class. */
  constructor(
    private readonly doc: Document,
    private readonly changed: () => void,
  ) {}

  /** Whether a world press is held. */
  get held(): boolean {
    return this.on;
  }

  /** Start or end the press. The move listener lives only as long as the
   *  press, so the page's moves cost nothing otherwise. */
  set(on: boolean): void {
    if (on === this.on) return;
    this.on = on;
    if (on) this.doc.addEventListener("pointermove", this.onMove, true);
    else this.doc.removeEventListener("pointermove", this.onMove, true);
    this.changed();
  }
}
