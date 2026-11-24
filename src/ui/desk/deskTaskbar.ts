import { html, nothing, type TemplateResult } from "lit-html";
import { renderDetached, type Detached } from "../detached";
import { DESK_ICON } from "./deskWindow";
import { WindowMenu, type WindowMenuHandlers } from "./deskWindowMenu";

/**
 * The 1994 desk's taskbar: the Start button and the menu it opens at the
 * left (a Verticopolis icon, never an operating system's logo, owner
 * 2026-11-15; labeled Start so it reads apart from a window named
 * Verticopolis, owner 2026-11-24), a button per open window in the middle (a right-click,
 * Shift+F10 or the context menu key opens its window menu), and the tray at
 * the right: the Control Panel's monitor, the speaker and the clock. A game
 * names the menu's items and decides what each press does; the look is
 * `styles/game/desk.css`.
 *
 * Cost: drawn once with lit and re-rendered when a window opens, closes,
 * minimizes or takes the focus, when the menu opens or closes, and once a
 * minute for the clock; lit touches only what changed.
 */

/** A window's button on the taskbar. */
export interface TaskEntry {
  readonly id: string;
  readonly label: string;
  /** The window has the focus. */
  readonly active: boolean;
  readonly minimized: boolean;
}

/** A Start menu item: its label and the id the game runs when it is
 *  picked. A null in the item list is a separator. */
export interface StartItem {
  readonly id: string;
  readonly label: string;
}

/** A tray button. */
export type TrayIcon = "display" | "sound";

export interface TaskbarOptions {
  /** The Start menu's items in order; null is a separator. */
  readonly items: readonly (StartItem | null)[];
  /** Whether an item shows now, asked each time the menu opens (an item whose
   *  game twin is hidden is left out); every item shows when absent. A
   *  separator with nothing shown after it is left out too. */
  readonly shown?: (itemId: string) => boolean;
  /** The icon on the Start button and each window's button;
   *  {@link DESK_ICON} when absent. */
  readonly icon?: string;
  /** A class added to the taskbar, beside `desk-taskbar`. */
  readonly className?: string;
  /** The clock's time; the computer's when absent. */
  readonly now?: () => Date;
  /** A window's taskbar button was pressed. */
  readonly task: (id: string) => void;
  /** A Start menu item was picked. */
  readonly start: (itemId: string) => void;
  /** Opens the Control Panel from the tray's monitor; without it the tray
   *  has no monitor. */
  readonly controlPanel?: () => void;
  /** Turns the sound on or off from the tray's speaker; without it the tray
   *  has no speaker. {@link DeskTaskbar.setSound} shows the sound's state. */
  readonly sound?: () => void;
  /** The window menu a window's button opens; without it a right-click on a
   *  button does nothing. */
  readonly windowMenu?: WindowMenuHandlers;
  /** The Start menu opened (for the analytics). */
  readonly opened?: () => void;
  /** A tray button was pressed (for the analytics). */
  readonly tray?: (icon: TrayIcon) => void;
}

/** The clock's text for `now`, as the 1995 tray showed it: "4:34 PM". */
export function trayClock(now: Date): string {
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** The items to show: those `shown` allows, with no separator at either end
 *  or two in a row. */
export function shownItems(
  items: readonly (StartItem | null)[],
  shown: (itemId: string) => boolean = () => true,
): (StartItem | null)[] {
  const out: (StartItem | null)[] = [];
  for (const item of items) {
    if (item) {
      if (shown(item.id)) out.push(item);
    } else if (out.length && out[out.length - 1] !== null) out.push(null);
  }
  if (out[out.length - 1] === null) out.pop();
  return out;
}

/** The id of the Start menu, which its button controls. */
export const START_MENU_ID = "desk-start-menu";

export class DeskTaskbar {
  readonly root: HTMLElement;
  private readonly drawn: Detached;
  private readonly winMenu: WindowMenu | null;
  private readonly icon: string;
  private entries: readonly TaskEntry[] = [];
  /** The items the open menu shows; empty while it is shut. */
  private menuItems: (StartItem | null)[] = [];
  private menuOpen = false;
  private soundOn = true;
  private clock = "";
  private clockTimer: number | null = null;

  constructor(
    private readonly doc: Document,
    private readonly opts: TaskbarOptions,
  ) {
    this.icon = opts.icon ?? DESK_ICON;
    this.winMenu = opts.windowMenu ? new WindowMenu(doc, opts.windowMenu) : null;
    this.drawn = renderDetached(doc, this.template());
    this.root = this.drawn.elements[0] as HTMLElement;
  }

  /** Start the clock and listen for presses off the menus; call when shown.
   *  A second call while it runs does nothing. */
  start(): void {
    if (this.clockTimer !== null) return;
    this.tick();
    this.doc.addEventListener("pointerdown", this.onOutside, true);
    this.doc.addEventListener("keydown", this.onEscape);
  }

  /** Stop the clock and the listeners; call when the desk goes away. */
  stop(): void {
    if (this.clockTimer !== null) clearTimeout(this.clockTimer);
    this.clockTimer = null;
    this.closeMenu();
    this.winMenu?.close();
    this.doc.removeEventListener("pointerdown", this.onOutside, true);
    this.doc.removeEventListener("keydown", this.onEscape);
  }

  /** Show one button per open window, in the order given. */
  render(entries: readonly TaskEntry[]): void {
    this.entries = entries;
    this.draw();
  }

  /** Show whether the sound is on, on the tray's speaker. */
  setSound(on: boolean): void {
    if (on === this.soundOn) return;
    this.soundOn = on;
    this.draw();
  }

  /** Open window `id`'s menu with its corner at (x, y), upward from y when
   *  `above` (from the taskbar). False when there is no window menu or it
   *  stays shut. */
  openWindowMenu(id: string, x: number, y: number, above = false, opener: HTMLElement | null = null): boolean {
    if (!this.winMenu) return false;
    this.closeMenu();
    return this.winMenu.show(id, x, y, above, opener);
  }

  private draw(): void {
    this.drawn.update(this.template());
  }

  private template(): TemplateResult {
    const o = this.opts;
    const icon = html`<img src=${this.icon} alt="" width="16" height="16" />`;
    const cls = o.className ? `desk-taskbar ${o.className}` : "desk-taskbar";
    const sound = this.soundOn ? "Sound is on. Click to turn it off." : "Sound is off. Click to turn it on.";
    const display = o.controlPanel
      ? html`<button type="button" class="desk-tray-display" aria-label="Control Panel" title="Control Panel" @click=${this.onDisplay}></button>`
      : nothing;
    const speaker = o.sound
      ? html`<button type="button" class=${this.soundOn ? "desk-tray-sound" : "desk-tray-sound muted"} aria-label=${sound} title=${sound} @click=${this.onSound}></button>`
      : nothing;
    return html`<div id="desk-taskbar" class=${cls} role="toolbar" aria-label="Taskbar">
      <button
        type="button"
        class=${this.menuOpen ? "desk-start on" : "desk-start"}
        aria-haspopup="menu"
        aria-expanded=${this.menuOpen ? "true" : "false"}
        aria-controls=${START_MENU_ID}
        @click=${this.onStart}
      >
        ${icon}Start
      </button>
      <div id=${START_MENU_ID} class="desk-start-menu" role="menu" aria-label="Start" ?hidden=${!this.menuOpen} @keydown=${this.onMenuKey}>
        <div class="desk-start-stripe" aria-hidden="true">VERTICO<b>POLIS</b></div>
        <div class="desk-start-list">${this.menuItems.map((i) => this.itemTemplate(i))}</div>
      </div>
      <div class="desk-tasks">${this.entries.map((e) => this.taskTemplate(e, icon))}</div>
      <div class="desk-tray">${display}${speaker}<span class="desk-tray-clock">${this.clock}</span></div>
      ${this.winMenu?.root ?? nothing}
    </div>`;
  }

  private itemTemplate(item: StartItem | null): TemplateResult {
    if (!item) return html`<hr class="mb-sep" />`;
    return html`<button type="button" class="mb-item" role="menuitem" data-item=${item.id} @click=${() => this.pick(item.id)}>${item.label}</button>`;
  }

  private taskTemplate(e: TaskEntry, icon: TemplateResult): TemplateResult {
    const on = e.active && !e.minimized;
    const menu = (ev: MouseEvent) => {
      if (!this.winMenu) return;
      ev.preventDefault();
      this.openWindowMenu(
        e.id,
        ev.clientX,
        this.root.getBoundingClientRect().top,
        true,
        ev.currentTarget as HTMLElement,
      );
    };
    const key = (ev: KeyboardEvent) => {
      if (!this.winMenu || !(ev.key === "ContextMenu" || (ev.key === "F10" && ev.shiftKey))) return;
      ev.preventDefault();
      const b = ev.currentTarget as HTMLElement;
      const r = b.getBoundingClientRect();
      this.openWindowMenu(e.id, r.left, r.top, true, b);
    };
    return html`<button
      type="button"
      class=${on ? "desk-task on" : "desk-task"}
      data-win=${e.id}
      aria-pressed=${on ? "true" : "false"}
      title=${e.label}
      @click=${() => this.opts.task(e.id)}
      @contextmenu=${menu}
      @keydown=${key}
    >
      ${icon}<span>${e.label}</span>
    </button>`;
  }

  private readonly onStart = (): void => {
    if (this.menuOpen) this.closeMenu();
    else this.openMenu();
  };

  private readonly onDisplay = (): void => {
    this.opts.tray?.("display");
    this.opts.controlPanel?.();
  };

  private readonly onSound = (): void => {
    this.opts.tray?.("sound");
    this.opts.sound?.();
  };

  private pick(itemId: string): void {
    this.closeMenu();
    this.opts.start(itemId);
  }

  private openMenu(): void {
    this.winMenu?.close();
    this.menuItems = shownItems(this.opts.items, this.opts.shown);
    this.menuOpen = true;
    this.draw();
    this.opts.opened?.();
    this.items()[0]?.focus();
  }

  private closeMenu(): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.menuItems = [];
    this.draw();
  }

  private items(): HTMLElement[] {
    return [...this.root.querySelectorAll<HTMLElement>(`#${START_MENU_ID} .mb-item`)];
  }

  private readonly onMenuKey = (e: KeyboardEvent): void => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = this.items();
    const at = items.indexOf(this.doc.activeElement as HTMLElement);
    const step = e.key === "ArrowDown" ? 1 : -1;
    items[(at + step + items.length) % items.length]?.focus();
  };

  private tick(): void {
    const now = this.opts.now?.() ?? new Date();
    const text = trayClock(now);
    if (text !== this.clock) {
      this.clock = text;
      this.draw();
    }
    // Wake at the next minute, not every second.
    this.clockTimer = window.setTimeout(() => this.tick(), (60 - now.getSeconds()) * 1000 + 50);
  }

  private readonly onOutside = (e: Event): void => {
    const t = e.target as Node | null;
    if (this.winMenu && !(t && this.winMenu.root.contains(t))) this.winMenu.close();
    const menu = this.root.querySelector(`#${START_MENU_ID}`);
    const button = this.root.querySelector(".desk-start");
    if (t && (menu?.contains(t) || button?.contains(t))) return;
    this.closeMenu();
  };

  private readonly onEscape = (e: KeyboardEvent): void => {
    if (e.key !== "Escape") return;
    this.winMenu?.close(true);
    if (!this.menuOpen) return;
    this.closeMenu();
    this.root.querySelector<HTMLElement>(".desk-start")?.focus();
  };
}
