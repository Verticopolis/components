/**
 * The 1994 desk's window menu: a right-click on a window's taskbar button or
 * its title bar opens Restore, Minimize, Maximize and Close, each grayed when
 * it does not apply, as the 1995 window menu did. Shift+F10 or the context
 * menu key opens it from a focused taskbar button; the arrow keys move through
 * it and Esc or a press outside closes it.
 *
 * Cost: one menu drawn once with the taskbar, with lit; each opening
 * re-renders it, and lit sets only the items whose grayed state changed.
 */

import { html, type TemplateResult } from "lit-html";
import { renderDetached, type Detached } from "../detached";
import type { DeskWindow } from "./deskWindow";

/** Where a window menu was opened: a right-click (or Shift+F10) on a taskbar
 *  button, or a right-click on a window's title bar. */
export type WindowMenuFrom = "taskbar" | "title_bar";

/** A window menu command. */
export type WindowCommand = "restore" | "minimize" | "maximize" | "close";

/** Which commands apply to a window now. */
export type WindowMenuState = Readonly<Record<WindowCommand, boolean>>;

/** The menu's items in order: a label and its command, a null a separator. */
export const WINDOW_MENU_ITEMS: ReadonlyArray<readonly [label: string, command: WindowCommand] | null> = [
  ["Restore", "restore"],
  ["Minimize", "minimize"],
  ["Maximize", "maximize"],
  null,
  ["Close", "close"],
];

/** What the window menu offers for `w` now, `active` being the window with
 *  the focus: Restore unless it is in front at its own size, Minimize unless
 *  minimized, Maximize for the tower when not maximized, Close when the game
 *  can close it (Info and Tools never close on the desk). */
export function windowMenuState<Id extends string>(
  w: DeskWindow<Id> | undefined,
  active: DeskWindow<Id> | null,
): WindowMenuState | null {
  if (!w) return null;
  const inFront = w === active && !w.minimized && !w.maximized;
  return { restore: !inFront, minimize: !w.minimized, maximize: w.spec.canMax && !w.maximized, close: !!w.spec.close };
}

/** Run `command` on `w`; `bringUp` puts it in front, back from the taskbar
 *  when minimized. Restore and Maximize bring it up first, as 1995 did. */
export function runWindowCommand<Id extends string>(
  w: DeskWindow<Id> | undefined,
  command: WindowCommand,
  bringUp: (w: DeskWindow<Id>) => void,
): void {
  if (!w) return;
  if (command === "minimize") w.minimize();
  else if (command === "close") w.spec.close?.();
  else {
    bringUp(w);
    if (w.maximized === (command === "restore")) w.toggleMax();
  }
}

export interface WindowMenuHandlers {
  /** What applies to window `id` now; null leaves the menu shut. */
  readonly state: (id: string) => WindowMenuState | null;
  /** Run `command` on window `id`. */
  readonly run: (id: string, command: WindowCommand) => void;
  /** The menu opened for window `id` (for the analytics): from a taskbar
   *  button (`above`) or a window's title bar. */
  readonly opened?: (id: string, from: WindowMenuFrom) => void;
}

export class WindowMenu {
  readonly root: HTMLElement;
  private readonly drawn: Detached;
  /** Which commands apply now; all grayed until the menu first opens. */
  private state: WindowMenuState = { restore: false, minimize: false, maximize: false, close: false };
  private target: string | null = null;
  /** Where focus goes back to when the menu closes from the keyboard. */
  private opener: HTMLElement | null = null;

  constructor(
    private readonly doc: Document,
    private readonly handlers: WindowMenuHandlers,
  ) {
    this.drawn = renderDetached(doc, this.template());
    this.root = this.drawn.elements[0] as HTMLElement;
  }

  /** The menu, its items grayed by {@link state}. Rendered once, then again
   *  each time it opens. */
  private template(): TemplateResult {
    const item = ([label, command]: readonly [string, WindowCommand]) =>
      html`<button type="button" class="mb-item" role="menuitem" data-command=${command} ?disabled=${!this.state[command]} @click=${this.pick}>${label}</button>`;
    return html`<div class="desk-win-menu" role="menu" aria-label="Window" hidden @keydown=${this.key}>${WINDOW_MENU_ITEMS.map((i) => (i ? item(i) : html`<hr class="mb-sep" />`))}</div>`;
  }

  /** An item's click: close the menu, then run its command on the window it
   *  was opened for, unless the item is grayed. */
  private readonly pick = (e: MouseEvent): void => {
    const b = e.currentTarget as HTMLButtonElement;
    const id = this.target;
    this.close(true);
    if (id && !b.disabled) this.handlers.run(id, b.dataset.command as WindowCommand);
  };

  get open(): boolean {
    return !this.root.hidden;
  }

  /** Open the menu for window `id` with its corner at (x, y) in the page;
   *  `above` opens it upward from y (from the taskbar). Kept on the screen. */
  show(id: string, x: number, y: number, above: boolean, opener: HTMLElement | null): boolean {
    const state = this.handlers.state(id);
    if (!state) return false;
    this.state = state;
    this.drawn.update(this.template());
    this.target = id;
    this.opener = opener;
    const root = this.root;
    root.hidden = false;
    const view = this.doc.defaultView;
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const maxX = (view?.innerWidth ?? x + w) - w;
    const top = above ? y - h : y;
    const maxY = (view?.innerHeight ?? top + h) - h;
    root.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    root.style.top = `${Math.max(0, Math.min(top, maxY))}px`;
    this.first()?.focus();
    this.handlers.opened?.(id, above ? "taskbar" : "title_bar");
    return true;
  }

  /** Close the menu; `refocus` gives the focus back to what opened it. */
  close(refocus = false): void {
    if (this.root.hidden) return;
    this.root.hidden = true;
    this.target = null;
    if (refocus) this.opener?.focus();
    this.opener = null;
  }

  private enabled(): HTMLButtonElement[] {
    return [...this.root.querySelectorAll<HTMLButtonElement>("button.mb-item:not(:disabled)")];
  }

  private first(): HTMLButtonElement | undefined {
    return this.enabled()[0];
  }

  private readonly key = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.close(true);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = this.enabled();
    const at = items.indexOf(this.doc.activeElement as HTMLButtonElement);
    const step = e.key === "ArrowDown" ? 1 : -1;
    items[(at + step + items.length) % items.length]?.focus();
  };
}
