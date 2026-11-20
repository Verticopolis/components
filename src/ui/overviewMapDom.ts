import { html, nothing, type TemplateResult } from "lit-html";
import { classMap } from "lit-html/directives/class-map.js";
import { styleMap } from "lit-html/directives/style-map.js";
import { iconTemplate } from "./icons";
import { WORLD_PRESS_CLASS } from "./overviewMapWorldPress";

/**
 * The overview MAP window's elements: the window with its title bar, the two
 * stacked canvases and the text summary, plus the Map button that opens it,
 * drawn from one lit template, and `ContextWatch`, which tracks whether the
 * canvases' 2D contexts are lost. `OverviewMapWindow` draws and wires them.
 */

/** The ids of the window's parts, which the CSS and the tests name. */
export const MAP_DOM_ID = {
  window: "overview-map",
  title: "overview-map-title",
  toggle: "btn-map",
  summary: "overview-map-summary",
} as const;

/** What the template shows. The window draws again only when one changes. */
export interface MapWindowView {
  readonly open: boolean;
  /** The tower layer is painted (the gallery runner and the tests read it). */
  readonly drawn: boolean;
  /** A world press is held: the window and its button let pointers through. */
  readonly worldPress: boolean;
  /** The body's sky and ground backdrop, or "" before the first paint. */
  readonly backdrop: string;
  readonly summary: string;
  /** The summary is heard only while the map has focus. */
  readonly live: "off" | "polite";
  /** The View dropdown, under the title bar. */
  readonly picker: TemplateResult | typeof nothing;
  /** The views' legends, over the top of the body. */
  readonly legends: TemplateResult | typeof nothing;
}

/** The window's handlers: one object for the window's life, so each draw
 *  binds the same functions. */
export interface MapWindowHandlers {
  readonly toggle: (e: MouseEvent) => void;
  readonly close: (e: MouseEvent) => void;
  readonly key: (e: KeyboardEvent) => void;
  readonly mouseDown: (e: MouseEvent) => void;
  /** Passive off, so a Ctrl+wheel can be canceled. */
  readonly wheel: { handleEvent(e: WheelEvent): void; passive: false };
  readonly mapFocus: () => void;
  readonly mapBlur: () => void;
  readonly pointerDown: (e: PointerEvent) => void;
  readonly pointerMove: (e: PointerEvent) => void;
  readonly pointerUp: (e: PointerEvent) => void;
  readonly pointerEnd: (e: PointerEvent) => void;
  readonly contextLost: (e: Event) => void;
  readonly contextRestored: (e: Event) => void;
}

const preventDefault = (e: Event) => e.preventDefault();

/** The window (hidden while closed) and its button, both at the top level so
 *  they can be placed in the game's stage. */
export function mapWindowTemplate(view: MapWindowView, on: MapWindowHandlers): TemplateResult {
  const press = { [WORLD_PRESS_CLASS]: view.worldPress };
  return html`<div
      id=${MAP_DOM_ID.window}
      class="win win-closable overview-map ${classMap(press)}"
      ?hidden=${!view.open}
      role="region"
      aria-labelledby=${MAP_DOM_ID.title}
      data-map-drawn=${view.drawn ? "true" : nothing}
      @keydown=${on.key}
      @contextmenu=${preventDefault}
      @mousedown=${on.mouseDown}
      @wheel=${on.wheel}
    >
      <div class="win-title">
        <span id=${MAP_DOM_ID.title}>Map</span
        ><button type="button" class="btn xs overview-map-close" aria-label="Close the map" @click=${on.close}>✕</button>
      </div>
      ${view.picker}
      <div class="overview-map-body" style=${styleMap({ background: view.backdrop || undefined })}>
        <canvas
          class="overview-map-tower"
          aria-hidden="true"
          @contextlost=${on.contextLost}
          @contextrestored=${on.contextRestored}
        ></canvas>
        <canvas
          class="overview-map-view"
          tabindex="0"
          role="application"
          aria-label="Tower map. Arrow keys move the view, Home and End go to the top and bottom."
          aria-describedby=${MAP_DOM_ID.summary}
          @focus=${on.mapFocus}
          @blur=${on.mapBlur}
          @pointerdown=${on.pointerDown}
          @pointermove=${on.pointerMove}
          @pointerup=${on.pointerUp}
          @pointercancel=${on.pointerEnd}
          @lostpointercapture=${on.pointerEnd}
          @contextlost=${on.contextLost}
          @contextrestored=${on.contextRestored}
        ></canvas>
        ${view.legends}
      </div>
      <p id=${MAP_DOM_ID.summary} class="visually-hidden" aria-live=${view.live}>${view.summary}</p>
    </div>
    <button
      type="button"
      id=${MAP_DOM_ID.toggle}
      class="btn overview-map-toggle ${classMap(press)}"
      ?hidden=${view.open}
      title="Show the tower map"
      aria-controls=${MAP_DOM_ID.window}
      @click=${on.toggle}
    >${iconTemplate("map")}Map</button>`;
}

/** What a frame finds of the canvases' 2D contexts (see `ContextWatch.poll`). */
export type MapContextState = "ready" | "lost" | "restored";

/**
 * Whether either canvas has lost its 2D context. The `contextlost` and
 * `contextrestored` events count where the browser fires them (the template
 * hands them to `lostEvent` and `restoredEvent`), and each frame also asks
 * each context `isContextLost()` (at most two calls), since a browser may
 * blank a canvas without the events. A lost context blanks its canvas, and a
 * restored one starts blank at its default state.
 */
export class ContextWatch {
  /** Canvases a `contextlost` event reported and no `contextrestored` has. */
  private readonly lostByEvent = new Set<EventTarget>();
  /** The last poll found a context lost. */
  private lost = false;
  /** A restore came since the last poll: a `contextrestored` fired, or every
   *  context answered `isContextLost()` with false while a loss event was
   *  still open (a loss and its restore can both fall between two frames). */
  private restoredByEvent = false;

  constructor(
    private readonly canvases: ReadonlyArray<HTMLCanvasElement>,
    private readonly contexts: ReadonlyArray<CanvasRenderingContext2D | null>,
  ) {}

  /** A canvas fired `contextlost`. */
  lostEvent(canvas: EventTarget | null): void {
    if (canvas) this.lostByEvent.add(canvas);
  }

  /** A canvas fired `contextrestored`. */
  restoredEvent(canvas: EventTarget | null): void {
    if (canvas) this.lostByEvent.delete(canvas);
    this.restoredByEvent = true;
  }

  /** Read once per open frame: "lost" while any context is lost, "restored"
   *  on the first frame they are all back, and "ready" otherwise. */
  poll(): MapContextState {
    // Where every context answers `isContextLost()`, its answer wins, so a
    // context given back without a `contextrestored` event still counts as
    // back. An engine without the method (older browsers) has the events.
    let answers = true;
    let lostNow = false;
    for (const ctx of this.contexts) {
      if (ctx === null) continue;
      if (typeof ctx.isContextLost !== "function") answers = false;
      else if (ctx.isContextLost()) lostNow = true;
    }
    if (answers && !lostNow && this.lostByEvent.size > 0) {
      this.lostByEvent.clear();
      this.restoredByEvent = true;
    }
    const lost = lostNow || this.lostByEvent.size > 0;
    const restored = !lost && (this.lost || this.restoredByEvent);
    this.lost = lost;
    if (!lost) this.restoredByEvent = false;
    if (lost) return "lost";
    return restored ? "restored" : "ready";
  }

  /** Clear every canvas whose context is there. */
  clear(): void {
    this.canvases.forEach((c, i) => this.contexts[i]?.clearRect(0, 0, c.width, c.height));
  }
}
