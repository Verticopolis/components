import { html, nothing, render, type TemplateResult } from "lit-html";
import { PALETTE_FIT_MQ } from "./paletteFit";

/**
 * The desktop Tools window folds into a thin strip and opens again, from a
 * button on its title bar, to give the tower more room. The choice is kept, so
 * a player who folds it finds it folded next time; only an explicit choice is
 * kept, and the default is open. Phones, sideways phones and tablets lay the
 * window out their own way, so the button and the folded look exist only on
 * the desktop layout (the rules in `styles/game/tools-stage.css` sit under
 * {@link PALETTE_FIT_MQ}), and a kept fold never hides a phone's tools.
 * Storage that is missing or throws reads as nothing kept, and a failed
 * write is dropped.
 */

/** The values kept: an explicit fold and an explicit open. */
export const PALETTE_COLLAPSED_VALUE = { collapsed: "collapsed", open: "open" } as const;

/** The class on `#palette` while it is folded. */
export const PALETTE_COLLAPSED_CLASS = "pal-collapsed";

/** The fold button's id, for a game's menu item or guide that presses it. */
export const PALETTE_COLLAPSE_BUTTON_ID = "btn-palette-collapse";

type Store = Pick<Storage, "getItem" | "setItem">;

export interface PaletteCollapseOptions {
  /** Where the choice is kept, and under which key. */
  readonly store?: { readonly key: string; readonly storage: Store | null };
  /** The window folded or opened: what it shows changed. */
  toggled?(collapsed: boolean): void;
}

/** Whether the player last folded the window, as kept under `key`. */
export function storedCollapsed(key: string, storage: Pick<Storage, "getItem"> | null): boolean {
  try {
    return storage?.getItem(key) === PALETTE_COLLAPSED_VALUE.collapsed;
  } catch {
    return false;
  }
}

function storeCollapsed(key: string, storage: Pick<Storage, "setItem"> | null, collapsed: boolean): void {
  try {
    storage?.setItem(key, collapsed ? PALETTE_COLLAPSED_VALUE.collapsed : PALETTE_COLLAPSED_VALUE.open);
  } catch {
    // A full or blocked storage keeps the choice for this visit only.
  }
}

/** The fold button: ▸ opens a folded window, ◂ folds an open one. */
function buttonTemplate(collapsed: boolean, controls: string | undefined, press: () => void): TemplateResult {
  const label = collapsed ? "Show the Tools" : "Hide the Tools";
  return html`<button
    type="button"
    class="btn xs pal-collapse"
    id=${PALETTE_COLLAPSE_BUTTON_ID}
    aria-controls=${controls ?? nothing}
    aria-expanded=${collapsed ? "false" : "true"}
    aria-label=${label}
    title=${label}
    @click=${press}
  >
    ${collapsed ? "▸" : "◂"}
  </button>`;
}

/**
 * The fold button on the Tools window `win` (the game's `#palette`, with its
 * `.win-title`), drawn at the end of the title bar, and the window started as
 * the player last left it.
 */
export class PaletteCollapse {
  private collapsed: boolean;
  private readonly bar: HTMLElement | null;

  constructor(
    private readonly win: HTMLElement,
    private readonly options: PaletteCollapseOptions = {},
  ) {
    this.bar = win.querySelector<HTMLElement>(":scope > .win-title");
    const store = options.store;
    this.collapsed = store ? storedCollapsed(store.key, store.storage) : false;
    this.draw();
  }

  isCollapsed(): boolean {
    return this.collapsed;
  }

  /** Fold the window or open it, keep the choice, and tell the game. */
  toggle(): void {
    this.collapsed = !this.collapsed;
    const store = this.options.store;
    if (store) storeCollapsed(store.key, store.storage, this.collapsed);
    this.draw();
    this.options.toggled?.(this.collapsed);
  }

  /** Open the window when `tool` sits in it while it is folded, as the
   *  button would, so a guide's pointer at the tool is in view. Only on the
   *  desktop layout, the one the fold shows on. */
  openAround(tool: Element): void {
    if (!this.collapsed || !this.win.contains(tool)) return;
    const view = this.win.ownerDocument.defaultView;
    if (typeof view?.matchMedia !== "function" || !view.matchMedia(PALETTE_FIT_MQ).matches) return;
    this.toggle();
  }

  private draw(): void {
    this.win.classList.toggle(PALETTE_COLLAPSED_CLASS, this.collapsed);
    if (!this.bar) return;
    const list = this.win.querySelector<HTMLElement>(".palette-scroll");
    render(
      buttonTemplate(this.collapsed, list?.id || undefined, () => this.toggle()),
      this.bar,
    );
  }
}
