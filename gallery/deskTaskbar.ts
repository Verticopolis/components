/**
 * The desk demo's taskbar: a sample drawn with lit over the package's desk
 * stylesheet (`styles/game/desk.css`), the way the sample menu bar shows the
 * menu bar. The package styles the taskbar, its Verticopolis menu and its
 * tray; a game draws them and decides what their items do. Here the clock is
 * fixed and the speaker only toggles its own look.
 */
import { html, type TemplateResult } from "lit-html";

/** A window's button on the taskbar. */
export interface TaskButton {
  readonly id: string;
  readonly label: string;
  /** Pressed in: the window is in front and not minimized. */
  readonly on: boolean;
}

/** A Verticopolis menu item, or a separator (null). */
export type StartItem = { readonly label: string; readonly run: () => void } | null;

/** What the taskbar shows now and what its presses do. */
export interface TaskbarView {
  readonly icon: string;
  readonly startOpen: boolean;
  readonly startItems: readonly StartItem[];
  readonly tasks: readonly TaskButton[];
  readonly muted: boolean;
  readonly toggleStart: () => void;
  readonly pickStart: (item: NonNullable<StartItem>) => void;
  readonly task: (id: string) => void;
  /** A right-click, Shift+F10 or the context menu key on a window's button. */
  readonly taskMenu: (id: string, button: HTMLElement, x: number, y: number) => void;
  readonly toggleSound: () => void;
}

/** The sample clock: fixed, so the screenshots hold still. */
const CLOCK = "9:15 AM";

/** The Verticopolis menu's id, which its button controls. */
export const START_MENU_ID = "g-desk-start-menu";

function taskTemplate(v: TaskbarView, t: TaskButton): TemplateResult {
  const menu = (e: MouseEvent) => {
    e.preventDefault();
    const b = e.currentTarget as HTMLElement;
    v.taskMenu(t.id, b, e.clientX, b.getBoundingClientRect().top);
  };
  const key = (e: KeyboardEvent) => {
    if (!(e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey))) return;
    e.preventDefault();
    const b = e.currentTarget as HTMLElement;
    const r = b.getBoundingClientRect();
    v.taskMenu(t.id, b, r.left, r.top);
  };
  return html`<button
    type="button"
    class=${t.on ? "desk-task on" : "desk-task"}
    aria-pressed=${t.on ? "true" : "false"}
    title=${t.label}
    @click=${() => v.task(t.id)}
    @contextmenu=${menu}
    @keydown=${key}
  >
    <img src=${v.icon} alt="" width="16" height="16" /><span>${t.label}</span>
  </button>`;
}

/** The Verticopolis menu, which opens upward from its button. Up and Down
 *  move through it; Escape closes it (the demo hears that on the desk). */
export function startMenuTemplate(v: TaskbarView): TemplateResult {
  const key = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const menu = e.currentTarget as HTMLElement;
    const items = [...menu.querySelectorAll<HTMLElement>(".mb-item")];
    const at = items.indexOf(document.activeElement as HTMLElement);
    items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };
  const item = (i: StartItem) =>
    i
      ? html`<button type="button" class="mb-item" role="menuitem" @click=${() => v.pickStart(i)}>${i.label}</button>`
      : html`<hr class="mb-sep" />`;
  return html`<div
    id=${START_MENU_ID}
    class="desk-start-menu"
    role="menu"
    aria-label="Verticopolis"
    ?hidden=${!v.startOpen}
    @keydown=${key}
  >
    <div class="desk-start-stripe" aria-hidden="true">VERTICO<b>POLIS</b></div>
    <div class="desk-start-list">${v.startItems.map(item)}</div>
  </div>`;
}

/** The taskbar: the Verticopolis button, a button per open window, and the
 *  tray with the speaker and the clock. */
export function taskbarTemplate(v: TaskbarView): TemplateResult {
  const sound = v.muted ? "Sound is off. Click to turn it on." : "Sound is on. Click to turn it off.";
  return html`<div class="desk-taskbar" role="toolbar" aria-label="Taskbar">
    <button
      type="button"
      class=${v.startOpen ? "desk-start on" : "desk-start"}
      aria-haspopup="menu"
      aria-expanded=${v.startOpen ? "true" : "false"}
      aria-controls=${START_MENU_ID}
      @click=${v.toggleStart}
    >
      <img src=${v.icon} alt="" width="16" height="16" />Verticopolis
    </button>
    <div class="desk-tasks">${v.tasks.map((t) => taskTemplate(v, t))}</div>
    <div class="desk-tray">
      <button
        type="button"
        class=${v.muted ? "desk-tray-sound muted" : "desk-tray-sound"}
        aria-label=${sound}
        title=${sound}
        @click=${v.toggleSound}
      ></button>
      <span class="desk-tray-clock">${CLOCK}</span>
    </div>
  </div>`;
}
