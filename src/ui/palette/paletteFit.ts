import { PALETTE_FOLDED_CLASS } from "./paletteFolds";

/**
 * Desktop fit for the Tools window (`#palette`). A tower with every tool
 * unlocked lists about forty tools under eleven headers, which is taller than
 * most desktop windows. On the desktop layout the window tries a few layouts
 * in order and keeps the first one that shows every tool without a scrollbar:
 *
 *   1. the normal rows;
 *   2. compact rows (less padding, tighter headers);
 *   3. two columns of normal rows (the window widens);
 *   4. two columns of compact rows.
 *
 * When even the last one is too tall (a very short window), it stays on the
 * last one, the shortest, and the window scrolls. Phones, sideways phones and
 * tablets lay the window out their own way (category tabs, a strip,
 * touch-size rows), so the fit leaves them alone: their media blocks all sit
 * below {@link PALETTE_FIT_MQ}, and the fit classes are cleared there. The
 * classes' rules are in `styles/game/tools-stage.css`.
 *
 * The fit reads layout (the scroll height against the window's height), so it
 * runs only when the answer can change: when a tool shows or hides (the game
 * calls the refit, as `ToolPalette.update` tells it), when the window's height
 * changes, when the viewport crosses into or out of the desktop layout, when a
 * tool under a folded category starts or stops showing (the picked tool and a
 * pointed-at tool stay in view), and once the page's fonts are ready. Never
 * per frame.
 */

/** The desktop layout: every viewport at least this wide docks the window as
 *  a plain vertical list. The phone, sideways phone and tablet media blocks
 *  all cap at 1023px wide. Mirrored by the fit rules in tools-stage.css. */
export const PALETTE_FIT_MQ = "(min-width: 1024px)";

/** The fit's layout classes on the `#palette` window. */
export const PALETTE_FIT = {
  /** Tighter rows and headers. */
  compact: "pal-fit-compact",
  /** The build categories flow into two columns. */
  columns: "pal-fit-columns",
} as const;

export type FitClass = (typeof PALETTE_FIT)[keyof typeof PALETTE_FIT];

/** The layouts to try, in order of preference: the first that fits is kept. */
const FIT_STEPS: readonly (readonly FitClass[])[] = [
  [],
  [PALETTE_FIT.compact],
  [PALETTE_FIT.columns],
  [PALETTE_FIT.columns, PALETTE_FIT.compact],
];

const ALL_FIT_CLASSES: readonly FitClass[] = [PALETTE_FIT.compact, PALETTE_FIT.columns];

/** True when the window shows its whole list without scrolling. */
function showsEverything(win: HTMLElement): boolean {
  return win.scrollHeight <= win.clientHeight;
}

/**
 * Pick the Tools window's layout. `desktop` is whether the desktop layout is
 * in force ({@link PALETTE_FIT_MQ}); off it, the fit classes are removed. The
 * steps run synchronously, so the browser paints only the final choice.
 * Answers the classes it kept.
 */
export function fitPalette(win: HTMLElement, desktop: boolean): readonly FitClass[] {
  win.classList.remove(...ALL_FIT_CLASSES);
  if (!desktop) return [];
  let kept: readonly FitClass[] = [];
  for (const step of FIT_STEPS) {
    win.classList.remove(...ALL_FIT_CLASSES);
    win.classList.add(...step);
    kept = step;
    if (showsEverything(win)) break;
  }
  return kept;
}

/** The classes that keep a tool in view under a folded category (the
 *  stylesheet hides a folded category's other tools): the picked tool, and
 *  the tool a game's guide points at. */
export const SHOWN_WHEN_FOLDED = ["active", "tt-pulse"] as const;

function showsWhenFolded(classes: readonly string[]): boolean {
  return SHOWN_WHEN_FOLDED.some((c) => classes.includes(c));
}

/** Whether a class change on a tool showed or hid it under a folded category. */
export function changesFoldedRows(record: MutationRecord): boolean {
  const item = record.target;
  if (!(item instanceof HTMLElement) || !item.classList.contains("pal-item")) return false;
  if (!item.closest(`.${PALETTE_FOLDED_CLASS}`)) return false;
  const before = (record.oldValue ?? "").split(/\s+/);
  return showsWhenFolded(before) !== showsWhenFolded([...item.classList]);
}

/**
 * Keep the Tools window `win` fitted while the page runs. The window is the
 * game's element; the fit only reads its layout and sets its two classes.
 */
export class PaletteFit {
  private readonly media: MediaQueryList | null;
  private readonly stops: (() => void)[] = [];
  private disposed = false;

  constructor(private readonly win: HTMLElement) {
    const view = win.ownerDocument.defaultView;
    this.media = typeof view?.matchMedia === "function" ? view.matchMedia(PALETTE_FIT_MQ) : null;
    const refit = () => this.refit();
    if (this.media) {
      const mq = this.media;
      mq.addEventListener("change", refit);
      this.stops.push(() => mq.removeEventListener("change", refit));
    }
    if (typeof ResizeObserver === "function") {
      let lastHeight = -1;
      const resize = new ResizeObserver((entries) => {
        const height = Math.round(entries[entries.length - 1].contentRect.height);
        if (height === lastHeight) return;
        lastHeight = height;
        this.refit();
      });
      resize.observe(win);
      this.stops.push(() => resize.disconnect());
    }
    if (typeof MutationObserver === "function") {
      const rows = new MutationObserver((records) => {
        if (records.some(changesFoldedRows)) this.refit();
      });
      rows.observe(win, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
      this.stops.push(() => rows.disconnect());
    }
    void win.ownerDocument.fonts?.ready.then(() => {
      if (!this.disposed) this.refit();
    });
    this.refit();
  }

  /** Fit the window now: after tools show or hide, or a category folds. */
  refit(): readonly FitClass[] {
    return fitPalette(this.win, this.media?.matches ?? false);
  }

  /** Stop watching the window. Its classes stay as they are. */
  dispose(): void {
    this.disposed = true;
    for (const stop of this.stops.splice(0)) stop();
  }
}
