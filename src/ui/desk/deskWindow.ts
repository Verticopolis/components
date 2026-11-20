import { html, nothing, type TemplateResult } from "lit-html";
import { styleMap } from "lit-html/directives/style-map.js";
import { renderDetached, type Detached } from "../detached";
import { MovableWindow, WITHIN_PARENT, moverOf } from "../movableWindow";
import { resizedTo, type DeskRect, type DeskWindowId, type SizeLimits } from "./deskGeometry";

/**
 * One window on the 1994 desk (option C, owner 2026-11-15): the tower, Info,
 * Tools, the Map, the Bulletin, Tower Info or Help. The desk either builds the
 * window's frame (the tower and Info have none of their own) or takes over a
 * window the game already draws with its own title bar (Tools and the small
 * windows), and then adds what a 1995 window has: minimize, maximize where it
 * is allowed, a size grip where it may resize, and the focus that turns its
 * title bar navy.
 *
 * Cost: nothing runs per frame. A move writes two styles per pointer move (the
 * game's MovableWindow); a resize draws a dotted outline and sets the size
 * once on release, so the tower's canvas resizes once per resize.
 */

/** What the desk tells a window it needs. */
export interface DeskWindowSpec<Id extends string = DeskWindowId> {
  /** The window's id: one of the game's by default, or a page's own. */
  readonly id: Id;
  /** The window element: a frame the desk built, or the game's own window. */
  readonly el: HTMLElement;
  /** The name on its taskbar button and in its buttons' labels. */
  readonly label: () => string;
  /** The icon at the left of its title bar, for a window that draws its own
   *  title bar; {@link DESK_ICON} when absent. */
  readonly icon?: string;
  /** The tower sits below the small windows, so they stay on top of it even
   *  when it is maximized; the small windows stack among themselves. */
  readonly layer: "app" | "tool";
  /** The resize limits, or null for a window of one size. */
  readonly limits: SizeLimits | null;
  /** Tools grows in height only. */
  readonly heightOnly?: boolean;
  readonly canMax: boolean;
  /** Whether the game has the window open (a closed window has no taskbar
   *  button). The game decides: the Map's ✕, Tower > Bulletin and the rest. */
  readonly isOpen: () => boolean;
  /** Open it the game's own way (Options > Map and the rest); absent for a
   *  window that is always open on the desk (the tower, Info, Tools). */
  readonly open?: () => void;
  /** Close it the game's own way (its ✕, File > Close); absent for a window
   *  the desk never closes (Info, Tools). */
  readonly close?: () => void;
  /** Heard after a move, a resize, a minimize or a maximize. */
  readonly changed: (what: DeskChange) => void;
  /** Heard on a press anywhere in the window. */
  readonly pressed: () => void;
}

/** What a window just did, for the taskbar, the saved layout and analytics. */
export type DeskChange = "move" | "resize" | "min" | "restore" | "max" | "unmax";

/** The class a minimized window wears: hidden but still laid out, so the
 *  tower's canvas keeps its size while the window sits on the taskbar. */
export const DESK_MINIMIZED_CLASS = "desk-minimized";
/** The class a maximized window wears. */
export const DESK_MAXIMIZED_CLASS = "desk-maximized";
/** The class the window that has the focus wears. */
export const DESK_ACTIVE_CLASS = "desk-active";

/** The title bar's button kinds. */
type TitleButtonKind = "min" | "max" | "close";

/** The glyphs of the title bar's buttons, drawn in pixels like the 1995 ones. */
const GLYPH: Record<TitleButtonKind | "restore", TemplateResult> = {
  min: html`<svg width="10" height="9" viewBox="0 0 10 9" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="7" width="6" height="2"/></svg>`,
  max: html`<svg width="9" height="9" viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true"><path d="M0 0h9v9H0zM1 2v6h7V2z" fill-rule="evenodd"/></svg>`,
  restore: html`<svg width="9" height="9" viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 0h7v6H7V2H2zM0 3h7v6H0zM1 5v3h5V5z" fill-rule="evenodd"/></svg>`,
  close: html`<svg width="8" height="7" viewBox="0 0 8 7" shape-rendering="crispEdges" aria-hidden="true"><path d="M0 0h2v1h1v1h2V1h1V0h2v1H7v1H6v1H5v1h1v1h1v1h1v1H6V6H5V5H3v1H2v1H0V6h1V5h1V4h1V3H2V2H1V1H0z"/></svg>`,
};

/** A title-bar button with a pixel glyph; `glyph` differs from `kind` only
 *  for maximize, which shows restore while the window is maximized. */
function titleButtonTemplate(
  kind: TitleButtonKind,
  label: string,
  onClick: () => void,
  glyph: keyof typeof GLYPH = kind,
): TemplateResult {
  return html`<button type="button" class=${`btn xs desk-btn desk-btn-${kind}`} aria-label=${label} title=${label} @click=${onClick}>${GLYPH[glyph]}</button>`;
}

/** The icon at the left of a desk window's title bar when the page names
 *  none: the app icon served beside the page, as the game serves it. */
export const DESK_ICON = "./favicon.png";

/** The icon at the left of a desk window's title bar. */
const titleIconTemplate = (src: string): TemplateResult =>
  html`<img class="desk-title-icon" src=${src} alt="" width="16" height="16" />`;

/** A desk frame's ✕: its label and what it does. */
export interface FrameClose {
  readonly label: string;
  readonly onClick: () => void;
}

/** The frame for content that has no window of its own (the tower, Info): a
 *  `.win` with the game's title bar, an optional ✕, and an empty body.
 *  `icon` is the title bar's icon. */
export function deskFrameTemplate(id: string, title: string, close?: FrameClose, icon = DESK_ICON): TemplateResult {
  const titleId = `${id}-title`;
  return html`<section id=${id} class="win win-closable desk-win desk-frame" aria-labelledby=${titleId}><div class="win-title">${titleIconTemplate(icon)}<span class="desk-title-text" id=${titleId}>${title}</span>${close ? titleButtonTemplate("close", close.label, close.onClick) : nothing}</div><div class="desk-body"></div></section>`;
}

/** A desk frame, drawn by {@link deskFrameTemplate}. */
export interface DeskFrame {
  readonly root: HTMLElement;
  /** Where the window's content goes. */
  readonly body: HTMLElement;
  /** Rename the window; lit changes the title's text alone. */
  setTitle(title: string): void;
}

/** Draw a desk frame, ready for the page to place on the desk; `icon` is the
 *  title bar's icon. */
export function buildFrame(doc: Document, id: string, title: string, close?: FrameClose, icon = DESK_ICON): DeskFrame {
  const drawn = renderDetached(doc, deskFrameTemplate(id, title, close, icon));
  const root = drawn.elements[0] as HTMLElement;
  return {
    root,
    body: root.querySelector<HTMLElement>(":scope > .desk-body")!,
    setTitle: (next) => drawn.update(deskFrameTemplate(id, next, close, icon)),
  };
}

/** The dotted outline a resize draws at `r` until the pointer lets go. */
const outlineTemplate = (r: DeskRect): TemplateResult =>
  html`<div class="desk-outline" style=${styleMap({ left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` })}></div>`;

/** A resize under way: where it started, where the pointer started, and the
 *  size the window takes on release. */
interface Resize {
  readonly start: DeskRect;
  readonly sx: number;
  readonly sy: number;
  readonly desk: HTMLElement;
  readonly outline: Detached;
  next: DeskRect;
}

export class DeskWindow<Id extends string = DeskWindowId> {
  minimized = false;
  maximized = false;
  private before: DeskRect | null = null;
  /** What the desk drew into the window, taken off again by dispose. */
  private readonly added: Element[] = [];
  private readonly ownMover: MovableWindow | null = null;
  /** Stops hearing the moves of a window the game moves itself. */
  private readonly unhear: (() => void) | null = null;
  /** Minimize and maximize, redrawn when the window maximizes or restores. */
  private readonly buttons: Detached | null = null;
  /** The resize under way, or null. */
  private resize: Resize | null = null;

  constructor(readonly spec: DeskWindowSpec<Id>) {
    const { el } = spec;
    const doc = el.ownerDocument;
    el.classList.add("desk-win");
    const bar = el.querySelector<HTMLElement>(":scope > .win-title");
    if (bar) {
      // The game's own windows wear the desk's icon too, while on the desk.
      if (!bar.querySelector(":scope > .desk-title-icon")) {
        const icon = renderDetached(doc, titleIconTemplate(spec.icon ?? DESK_ICON)).elements;
        this.added.push(...icon);
        bar.prepend(...icon);
      }
      // Minimize and maximize go before the window's own ✕, as in 1995.
      const close = bar.querySelector<HTMLElement>(":scope > .btn.xs:not(.desk-btn), :scope > .desk-btn-close");
      this.buttons = renderDetached(doc, this.buttonsTemplate());
      this.added.push(...this.buttons.elements);
      for (const b of this.buttons.elements) bar.insertBefore(b, close);
    }
    if (spec.limits) {
      const grip = renderDetached(doc, this.gripTemplate()).elements;
      this.added.push(...grip);
      el.append(...grip);
    }
    // The small windows already move by their title bars; the desk's own
    // frames and Tools get a mover here. Either way it moves inside the desk.
    const gameMover = moverOf(el);
    if (gameMover) this.unhear = gameMover.hear(() => spec.changed("move"));
    else {
      this.ownMover = new MovableWindow({
        win: el,
        title: `#${el.id} > .win-title`,
        within: WITHIN_PARENT,
        placed: () => spec.changed("move"),
        doubleClick: () => (spec.canMax ? this.toggleMax() : undefined),
        canMove: () => !this.maximized,
      });
    }
    // On the game's window, which no template of ours owns.
    el.addEventListener("pointerdown", this.onPress, true);
    // A press or Tab into a frame in the window (the Help window's manual)
    // never reaches this document; the page only loses focus to the frame.
    doc.defaultView?.addEventListener("blur", this.onPageBlur);
  }

  /** Minimize, and maximize (or restore) where the window may maximize. */
  private buttonsTemplate(): TemplateResult {
    const name = this.spec.label();
    const max = this.maximized
      ? titleButtonTemplate("max", `Restore ${name}`, this.onMax, "restore")
      : titleButtonTemplate("max", `Maximize ${name}`, this.onMax);
    return html`${titleButtonTemplate("min", `Minimize ${name}`, this.onMin)}${this.spec.canMax ? max : nothing}`;
  }

  private readonly onMin = () => this.minimize();
  private readonly onMax = () => this.toggleMax();

  /** The size grip: a dotted outline follows the pointer and the window takes
   *  the size on release. */
  private gripTemplate(): TemplateResult {
    return html`<div class="desk-grip" aria-hidden="true" @pointerdown=${this.gripDown} @pointermove=${this.gripMove} @pointerup=${this.gripEnd} @pointercancel=${this.gripEnd}></div>`;
  }

  private readonly onPress = () => this.spec.pressed();

  /** The page lost focus: once it settles, a frame in this window holding
   *  the focus counts as a press on the window. */
  private readonly onPageBlur = (): void => {
    this.spec.el.ownerDocument.defaultView?.setTimeout(this.focusMoved, 0);
  };

  private readonly focusMoved = (): void => {
    const active = this.spec.el.ownerDocument.activeElement;
    if (active?.tagName === "IFRAME" && this.spec.el.contains(active)) this.spec.pressed();
  };

  /** The window's place and size now, in desk pixels. */
  rect(): DeskRect {
    const el = this.spec.el;
    if (this.maximized && this.before) return this.before;
    return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
  }

  /** Put the window at `rect`; a fixed-size window takes the corner only. */
  place(rect: DeskRect): void {
    const el = this.spec.el;
    if (this.spec.limits) {
      if (!this.spec.heightOnly) el.style.width = `${rect.w}px`;
      el.style.height = `${rect.h}px`;
    }
    const mover = moverOf(el);
    if (mover) mover.moveTo({ x: rect.x, y: rect.y });
    else {
      el.style.left = `${rect.x}px`;
      el.style.top = `${rect.y}px`;
    }
  }

  minimize(): void {
    if (this.minimized) return;
    this.minimized = true;
    this.spec.el.classList.add(DESK_MINIMIZED_CLASS);
    this.spec.changed("min");
  }

  restore(): void {
    if (!this.minimized) return;
    this.minimized = false;
    this.spec.el.classList.remove(DESK_MINIMIZED_CLASS);
    this.spec.changed("restore");
  }

  toggleMax(): void {
    if (!this.spec.canMax) return;
    const el = this.spec.el;
    if (!this.maximized) {
      this.before = this.rect();
      this.maximized = true;
      moverOf(el)?.reset();
      el.classList.add(DESK_MAXIMIZED_CLASS);
      Object.assign(el.style, { left: "0px", top: "0px", width: "100%", height: "100%" });
    } else {
      const back = this.before;
      this.maximized = false;
      this.before = null;
      el.classList.remove(DESK_MAXIMIZED_CLASS);
      if (back) this.place(back);
    }
    this.buttons?.update(this.buttonsTemplate());
    this.spec.changed(this.maximized ? "max" : "unmax");
  }

  /** Take the desk's additions off and give the window back to the game's
   *  own layout (the phone, the title screen, or the desk turned off). */
  dispose(): void {
    const el = this.spec.el;
    this.endResize(false);
    el.removeEventListener("pointerdown", this.onPress, true);
    el.ownerDocument.defaultView?.removeEventListener("blur", this.onPageBlur);
    for (const a of this.added) a.remove();
    this.ownMover?.dispose();
    this.unhear?.();
    moverOf(el)?.reset();
    el.classList.remove("desk-win", DESK_MINIMIZED_CLASS, DESK_MAXIMIZED_CLASS, DESK_ACTIVE_CLASS);
    el.style.removeProperty("width");
    el.style.removeProperty("height");
    el.style.removeProperty("z-index");
    el.style.removeProperty("left");
    el.style.removeProperty("top");
  }

  private readonly gripDown = (e: PointerEvent): void => {
    const limits = this.spec.limits;
    if (!limits || e.button !== 0 || this.maximized) return;
    // A resize whose pointerup never came (the pointer left the page) ends here.
    this.endResize(false);
    e.preventDefault();
    e.stopPropagation();
    const el = this.spec.el;
    const desk = el.parentElement;
    if (!desk) return;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* the outline still follows while the pointer stays over the grip */
    }
    const start = this.rect();
    const outline = renderDetached(el.ownerDocument, outlineTemplate(start));
    desk.append(...outline.elements);
    this.resize = { start, sx: e.clientX, sy: e.clientY, desk, outline, next: start };
  };

  private readonly gripMove = (e: PointerEvent): void => {
    const r = this.resize;
    const limits = this.spec.limits;
    if (!r || !limits) return;
    r.next = resizedTo(
      r.start,
      e.clientX - r.sx,
      e.clientY - r.sy,
      limits,
      r.desk.clientWidth,
      r.desk.clientHeight,
      !!this.spec.heightOnly,
    );
    r.outline.update(outlineTemplate(r.next));
  };

  private readonly gripEnd = (): void => this.endResize(true);

  /** Take the resize outline down; `apply` gives the window the new size. */
  private endResize(apply: boolean): void {
    const r = this.resize;
    if (!r) return;
    this.resize = null;
    for (const o of r.outline.elements) o.remove();
    if (!apply || (r.next.w === r.start.w && r.next.h === r.start.h)) return;
    this.place(r.next);
    this.spec.changed("resize");
  }
}
