/**
 * A Map view's legend (#343 S6 and S8): a small key over the top of the map
 * body, as in the original, with a swatch per entry and the number of rooms
 * showing it, so the view reads in words as well as in color. It takes no
 * pointer, so a press on it lands on the map. The Hotel, Eval and Pricing
 * views each have one; only the selected view's legend shows. The window
 * draws it with `template()`, and draws again when `count` or `setShown`
 * answers that something changed.
 */
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { MapViewId } from "../render/overviewMap/views";
import type { MapKindStyle } from "../render/overviewMap/style";

/** What a legend entry shows: its label and its swatch. */
export interface LegendEntry {
  readonly label: string;
  readonly style: MapKindStyle;
}

export class MapLegend {
  private rootEl: HTMLElement | null = null;
  private shown = false;
  /** Each entry's count as written, in entry order. */
  private readonly written: string[];
  /** The measured reach (`reach`), and the body width it was measured at;
   *  NaN until a shown legend has been measured. */
  private reached = Number.NaN;
  private reachedAt = Number.NaN;
  private readonly rootRef = (el: Element | undefined) => {
    this.rootEl = el instanceof HTMLElement ? el : null;
  };

  constructor(
    private readonly view: MapViewId,
    private readonly entries: ReadonlyArray<LegendEntry>,
  ) {
    this.written = entries.map(() => "");
  }

  /** The legend: a swatch, a label and a count per entry. */
  template(): TemplateResult {
    const items = this.entries.map(
      (entry, i) =>
        html`<span class="overview-map-legend-item"
          ><span
            class="overview-map-swatch"
            data-pattern=${entry.style.pattern}
            style="background-color: ${entry.style.fill}"
            aria-hidden="true"
          ></span
          ><span>${entry.label}: </span><span class="overview-map-legend-count">${this.written[i]}</span></span
        >`,
    );
    return html`<div class="overview-map-legend" data-view=${this.view} ?hidden=${!this.shown} ${ref(this.rootRef)}
      >${items}</div
    >`;
  }

  /** The drawn legend, once the window has drawn it. */
  get root(): HTMLElement | null {
    return this.rootEl;
  }

  /** Show or hide the legend. Answers whether that changed it. */
  setShown(shown: boolean): boolean {
    this.reached = Number.NaN;
    if (shown === this.shown) return false;
    this.shown = shown;
    return true;
  }

  /** How far down the body the legend reaches, in CSS pixels: its top offset
   *  plus its height. It is measured once per change (shown, a count written,
   *  a new body `width`), so a steady frame reads no layout. A legend not laid
   *  out yet (the window still hidden) measures 0 and is measured again. */
  reach(width: number): number {
    if (width !== this.reachedAt || !(this.reached > 0)) {
      const root = this.rootEl;
      this.reached = !root || root.hidden ? 0 : root.offsetTop + root.offsetHeight;
      this.reachedAt = width;
    }
    return this.reached;
  }

  /** Take each entry's room count, `rooms(i)` for entry `i`. Answers whether
   *  any count changed, so the window draws again only then. */
  count(rooms: (i: number) => number): boolean {
    let changed = false;
    for (let i = 0; i < this.written.length; i++) {
      const text = String(rooms(i));
      if (text === this.written[i]) continue;
      this.written[i] = text;
      changed = true;
      // A longer count can wrap the legend onto another line.
      this.reached = Number.NaN;
    }
    return changed;
  }
}
