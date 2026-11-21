/**
 * The overview MAP window (#343): a small window inside the game's stage with two
 * stacked canvases, the tower (repainted only when the model rebuilds) and the
 * view mark (repainted only when the camera moved), plus the Map button that
 * opens it. The world canvas never sees the window's pointers, so building,
 * panning and pinching there work the same with the window open.
 *
 * The app calls `frame()` once per rendered frame. A closed window returns at
 * once; an open one does constant work unless the tower, the box or the
 * camera changed (see `OverviewMapModel`). Everything it shows comes
 * from the view, the bound world and the camera; moves go through the
 * renderer's own clamp (`moveCamera`).
 */
import { html, nothing, type TemplateResult } from "lit-html";
import { SKY_HEADROOM_FLOORS } from "../render/cameraBounds";
import { OverviewMapModel, type MapFrameInput } from "../render/overviewMap/model";
import {
  createPatternSource,
  paintGapsAndShafts,
  paintMapMarks,
  type PatternSource,
} from "../render/overviewMap/paint";
import { MAP_MIN_GAP_CSS_PX } from "../render/overviewMap/gaps";
import { MAP_BACKDROP, groundShare, paintViewMark } from "../render/overviewMap/viewMark";
import { renderDetached, type Detached } from "./detached";
import { ContextWatch, mapWindowTemplate, type MapWindowHandlers } from "./overviewMapDom";
import { MapKeyKeeper, PointerFocusClaim } from "./overviewMapKeys";
import { MapPresses } from "./overviewMapPresses";
import { WorldPress } from "./overviewMapWorldPress";
import { isKeyboardClick, keyTarget, MAP_KEY, passesMapKey, pixelRatio } from "./overviewMapInput";
import { mapStartsOpen, rememberMapOpen, type MapLayoutClass } from "./overviewMapPrefs";
import { mapSummary } from "./overviewMapText";
import type { MutableMapCamera, OverviewMapDeps } from "./overviewMapDeps";

export type { MutableMapCamera, OverviewMapDeps, OverviewMapSource } from "./overviewMapDeps";
export { WORLD_PRESS_CLASS } from "./overviewMapWorldPress";
export { MAP_DOM_ID } from "./overviewMapDom";

export class OverviewMapWindow {
  readonly root: HTMLElement;
  readonly toggle: HTMLButtonElement;
  private readonly body: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly towerCanvas: HTMLCanvasElement;
  private readonly viewCanvas: HTMLCanvasElement;
  private readonly towerCtx: CanvasRenderingContext2D | null;
  private readonly viewCtx: CanvasRenderingContext2D | null;
  private patterns: PatternSource | null = null;
  private readonly model = new OverviewMapModel();
  private readonly cam: MutableMapCamera = { posX: 0, posY: 0, zoom: 1, viewWidth: 0, viewHeight: 0 };
  private layoutClass: MapLayoutClass;
  private open = false;
  private sizeDirty = true;
  private px = 1;
  /** What the template shows; `draw` puts it on the page. */
  private drawn = false;
  private backdrop = "";
  private summaryText = "";
  private live: "off" | "polite" = "off";
  private readonly elements: Detached;
  private resizeObserver: ResizeObserver | null = null;
  private readonly contexts: ContextWatch;
  /** The canvases were cleared for a blank map (no tower, or a lost context). */
  private blanked = false;
  private readonly worldPress: WorldPress;
  private readonly presses: MapPresses;
  private readonly onDocPointerDown = (e: PointerEvent) => this.presses.pageDown(e);
  private readonly onDocPointerUp = (e: PointerEvent) => this.presses.pageUp(e);
  private readonly keys: MapKeyKeeper;
  private readonly pointerFocus: PointerFocusClaim;
  /** The one frame input, refilled in place each frame. */
  private readonly input: { -readonly [K in keyof MapFrameInput]: MapFrameInput[K] };
  /** The page lost focus: any press or key still held was let go elsewhere. */
  private readonly onWindowBlur = () => {
    this.worldPress.set(false);
    // A press held while the page lost focus never gets its release, and
    // focus the browser restores on return is not a pointer's.
    this.presses.reset();
    this.pointerFocus.forget();
    this.keys.clear();
  };
  private readonly handlers: MapWindowHandlers = {
    toggle: (e) => {
      this.setOpen(true, true);
      // The button hides while the map is open. A keyboard press moves focus
      // onto the map; a mouse user keeps the game's keys for the world.
      if (isKeyboardClick(e)) this.focusMap();
    },
    close: (e) => this.closeFromWindow(isKeyboardClick(e)),
    key: (e) => this.onKey(e),
    // A mouse press never focuses the map, so a click on it leaves the game's
    // keys with the world. Buttons keep their default (a mouse close blurs the
    // close button), so their pressed look still shows in every browser, and
    // the View dropdown keeps it so it opens (it hands focus back itself).
    mouseDown: (e) => {
      if (!(e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement)) e.preventDefault();
    },
    // A pinch or Ctrl+wheel over the window never zooms the page.
    wheel: { handleEvent: (e) => e.ctrlKey && e.preventDefault(), passive: false },
    mapFocus: () => {
      // A pointer press never focuses the map (a browser that focuses on a
      // canceled pointerdown, or on the tap's click, included), so the game
      // keeps its keys. Any other focus (Tab, the Map button from the
      // keyboard or assistive tech, a dialog giving focus back) stays.
      if (this.pointerFocus.claimsNow()) this.viewCanvas.blur();
      else this.setLive("polite");
    },
    mapBlur: () => this.setLive("off"),
    pointerDown: (e) => this.presses.pointerDown(e),
    pointerMove: (e) => this.presses.pointerMove(e),
    pointerUp: (e) => this.presses.end(e, true),
    pointerEnd: (e) => this.presses.end(e, false),
    contextLost: (e) => {
      this.contexts.lostEvent(e.currentTarget);
      this.forgetDrawing();
    },
    contextRestored: (e) => {
      this.contexts.restoredEvent(e.currentTarget);
      this.forgetDrawing();
    },
  };

  constructor(private readonly deps: OverviewMapDeps) {
    const doc = deps.stage.ownerDocument;
    this.worldPress = new WorldPress(doc, () => this.draw());
    this.layoutClass = deps.isPhone() ? "phone" : "desktop";
    this.elements = renderDetached(doc, this.template());
    const [root, toggle] = this.elements.elements as [HTMLElement, HTMLButtonElement];
    this.root = root;
    this.toggle = toggle;
    this.body = root.querySelector<HTMLElement>(".overview-map-body")!;
    this.closeButton = root.querySelector<HTMLButtonElement>(".overview-map-close")!;
    this.towerCanvas = root.querySelector<HTMLCanvasElement>(".overview-map-tower")!;
    this.viewCanvas = root.querySelector<HTMLCanvasElement>(".overview-map-view")!;
    this.keys = new MapKeyKeeper(root);
    this.pointerFocus = new PointerFocusClaim(this.keys);
    this.presses = new MapPresses({
      root,
      toggle,
      close: this.closeButton,
      map: this.viewCanvas,
      model: this.model,
      deps,
      cam: this.cam,
      px: () => this.px,
      pointerFocus: this.pointerFocus,
      worldPress: this.worldPress,
    });
    deps.views?.attach(() => this.draw());
    this.input = {
      view: { structure: [], rooms: [], tower: { lowestFloor: 1, highestFloor: 1, transports: [] } },
      world: { lotWidth: 1, minFloor: 0, maxFloor: 0 },
      skyFloors: SKY_HEADROOM_FLOORS,
      boxWidth: 1,
      boxHeight: 1,
      topReserve: 0,
      minGapPx: 0,
      floorsOf: deps.floorsOf,
      tallLobbies: () => deps.tallLobbies?.() ?? [],
    };
    // First in the stage: positioned, it still paints over the world canvas,
    // and the inspector and editor cards after it paint over it.
    deps.stage.prepend(root, toggle);

    this.towerCtx = this.towerCanvas.getContext("2d");
    this.viewCtx = this.viewCanvas.getContext("2d");
    this.contexts = new ContextWatch([this.towerCanvas, this.viewCanvas], [this.towerCtx, this.viewCtx]);
    doc.addEventListener("pointerdown", this.onDocPointerDown, true);
    doc.addEventListener("pointerup", this.onDocPointerUp, true);
    doc.addEventListener("pointercancel", this.onDocPointerUp, true);
    doc.defaultView?.addEventListener("blur", this.onWindowBlur);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => (this.sizeDirty = true));
      this.resizeObserver.observe(this.body);
    }
    this.setOpen(mapStartsOpen(deps.storage, this.layoutClass), false);
  }

  /** The window and its button as they stand. */
  private template(): TemplateResult {
    const views = this.deps.views;
    return mapWindowTemplate(
      {
        open: this.open,
        drawn: this.drawn,
        worldPress: this.worldPress.held,
        backdrop: this.backdrop,
        summary: this.summaryText,
        live: this.live,
        picker: views ? views.pickerTemplate() : nothing,
        legends: views ? html`${views.legendsTemplate()}` : nothing,
      },
      this.handlers,
    );
  }

  /** Put what changed on the page. Called only on a change (open or closed, a
   *  paint, a new summary, focus, a held world press, the views' dropdown or
   *  legends), never on a steady frame. */
  private draw(): void {
    // The constructor's first render draws before `elements` exists.
    this.elements?.update(this.template());
  }

  private setLive(live: "off" | "polite"): void {
    if (live === this.live) return;
    this.live = live;
    this.draw();
  }

  /** Whether the window is open. */
  isOpen(): boolean {
    return this.open;
  }

  /** The layout class changed (the phone breakpoint was crossed): take that
   *  layout's stored choice, or its default. The window moves and resizes, so
   *  a press in progress ends. */
  layoutChanged(): void {
    const next: MapLayoutClass = this.deps.isPhone() ? "phone" : "desktop";
    if (next === this.layoutClass) return;
    this.layoutClass = next;
    this.presses.reset();
    this.sizeDirty = true;
    // A breakpoint change that opens the window hides the focused button, so
    // focus moves onto the map. Only this path does it: a click on the button
    // focuses the button first in some browsers, and a mouse user keeps the
    // game's keys.
    const toggleHadFocus = this.root.ownerDocument.activeElement === this.toggle;
    this.setOpen(mapStartsOpen(this.deps.storage, next), false);
    if (toggleHadFocus && this.open) this.focusMap();
  }

  /** Focus the map on the window's own account, ending any pointer claim. */
  private focusMap(): void {
    this.pointerFocus.forget();
    this.viewCanvas.focus({ preventScroll: true });
  }

  /** Open or close the window. `remember` stores the choice for this layout
   *  class, which only an explicit open or close does. */
  setOpen(open: boolean, remember: boolean): void {
    if (remember) rememberMapOpen(this.deps.storage, this.layoutClass, open);
    if (open === this.open && this.root.hidden === !open) return;
    // Focus inside a window about to hide goes back to the button, so it is
    // not lost to the page.
    const hadFocus = !open && this.root.contains(this.root.ownerDocument.activeElement);
    this.open = open;
    this.presses.reset();
    this.forgetDrawing();
    if (!open) this.deps.views?.release();
    this.draw();
    if (hadFocus) this.toggle.focus();
    // A reopened window has missed every change while it was closed, a loss
    // and restore of a context that left nothing for a poll to see included.
    if (open) {
      this.restart();
      this.frame();
    }
  }

  /** Close from the window's own controls. A keyboard close (Escape, or the
   *  close button pressed from the keyboard) gives focus to the Map button; a
   *  mouse close leaves it with the page, so the next Space or Enter is the
   *  game's and never reopens the map. */
  private closeFromWindow(keyboard: boolean): void {
    this.setOpen(false, true);
    const active = this.root.ownerDocument.activeElement;
    if (keyboard) this.toggle.focus();
    else if (active === this.toggle) this.toggle.blur();
  }

  /** Bring the window up to date for this frame. Constant work unless the
   *  tower, the box or the camera changed. */
  frame(): void {
    if (!this.open) return;
    const src = this.deps.source();
    const contexts = this.contexts.poll();
    // A restored context starts blank, at its default state, and its pattern
    // tiles may be gone (`blank` or the event already forgot the drawing).
    // Taken before the no-tower check, so a restore on such a frame holds.
    if (contexts === "restored") this.restart();
    if (!src || contexts === "lost") return this.blank();
    this.blanked = false;
    // A ResizeObserver does not fire when only the pixel ratio changes (a
    // window dragged to another screen), so the ratio is compared each frame.
    if (this.sizeDirty || pixelRatio(this.deps.stage.ownerDocument.defaultView) !== this.px) this.resize();
    const input = this.input;
    input.view = src.view;
    input.world = src.world;
    input.boxWidth = this.towerCanvas.width;
    input.boxHeight = this.towerCanvas.height;
    // The selected view's legend covers the body's top; the crop adds sky
    // for it, so no floor sits under the legend (#1769).
    input.topReserve = (this.deps.views?.legendReserve(input.boxWidth) ?? 0) * this.px;
    input.minGapPx = MAP_MIN_GAP_CSS_PX * this.px;
    const rebuilt = this.model.sync(input);
    const layout = this.model.layout;
    if (!layout) return;
    // The selected view may repaint without a rebuild (Hotel hourly; Eval and
    // Pricing on a new hour or an applied command).
    if (this.deps.views?.due(layout, rebuilt) || rebuilt) {
      const wasDrawn = this.drawn;
      // Marked only once painted: screenshot runs wait for it.
      if (this.towerCtx && this.patterns) {
        paintMapMarks(this.towerCtx, layout.width, layout.height, this.model.marks, this.model.gaps, this.patterns);
        // A view's rooms go under the gaps and the shafts, as on the Edit view.
        if (this.deps.views?.paintOver(this.towerCtx, this.patterns))
          paintGapsAndShafts(this.towerCtx, this.model.marks, this.model.gaps, this.patterns);
        this.drawn = true;
      }
      const ground = `${(groundShare(layout) * 100).toFixed(2)}%`;
      const backdrop = `linear-gradient(to bottom, ${MAP_BACKDROP.sky} ${ground}, ${MAP_BACKDROP.ground} ${ground})`;
      if (backdrop !== this.backdrop || this.drawn !== wasDrawn) {
        this.backdrop = backdrop;
        this.draw();
      }
    }
    this.deps.readCamera(this.cam);
    const placement = this.model.syncCamera(this.cam);
    if (placement) {
      if (this.viewCtx) paintViewMark(this.viewCtx, layout, placement, this.px);
      this.writeSummary(mapSummary(src.view.tower, placement));
    }
  }

  /** Size both backing stores to the body's CSS box times the pixel ratio.
   *  Setting a canvas's size clears it, so it is set only when it changes. */
  private resize(): void {
    this.sizeDirty = false;
    const ratio = pixelRatio(this.deps.stage.ownerDocument.defaultView);
    this.px = ratio;
    const w = Math.max(1, Math.round(this.body.clientWidth * ratio));
    const h = Math.max(1, Math.round(this.body.clientHeight * ratio));
    let cleared = false;
    for (const c of [this.towerCanvas, this.viewCanvas]) {
      if (c.width === w && c.height === h) continue;
      c.width = w;
      c.height = h;
      cleared = true;
    }
    // The pattern tiles stay valid, but cleared canvases need a full paint
    // (the new box alone would rebuild the tower and leave the view mark blank).
    if (cleared) this.forgetDrawing();
  }

  /** The canvases are blank or stale: unmarked until the next paint. */
  private forgetDrawing(): void {
    this.model.reset();
    if (!this.drawn) return;
    this.drawn = false;
    this.draw();
  }

  /** No tower, or a lost context: clear the old picture and its summary once,
   *  so no stale view box shows or takes a press, until a full repaint. */
  private blank(): void {
    if (this.blanked) return;
    this.blanked = true;
    this.forgetDrawing();
    this.contexts.clear();
    this.writeSummary("");
  }

  /** Measure the box again, and start new pattern tiles (they fill lazily). */
  private restart(): void {
    this.sizeDirty = true;
    this.patterns = this.towerCtx
      ? createPatternSource(() => this.root.ownerDocument.createElement("canvas"), this.towerCtx)
      : null;
  }

  /** Write the summary only when it changed, so a screen reader is not sent the
   *  same text every time the camera moves within a floor. */
  private writeSummary(text: string): void {
    if (text === this.summaryText) return;
    this.summaryText = text;
    this.draw();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === MAP_KEY.close) {
      e.preventDefault();
      this.keys.keep(e);
      this.closeFromWindow(true);
      return;
    }
    if (passesMapKey(e)) return;
    // With focus in the window, every game key but zoom, speed, Tab, Space
    // and the shortcuts (`passesMapKey`) stays out of the world behind it:
    // building, bulldozing and the build cursor do nothing there. Keeping the
    // key never cancels it, so Enter still presses the close button.
    this.keys.keep(e);
    if (e.target !== this.viewCanvas) return;
    const layout = this.model.layout;
    if (!layout) return;
    this.deps.readCamera(this.cam);
    const target = keyTarget(e.key, e.shiftKey, this.cam, layout.extent);
    if (!target) return;
    e.preventDefault();
    this.deps.moveCamera(target);
  }

  /** Remove the window, its button and its page listeners. */
  dispose(): void {
    const doc = this.root.ownerDocument;
    doc.removeEventListener("pointerdown", this.onDocPointerDown, true);
    doc.removeEventListener("pointerup", this.onDocPointerUp, true);
    doc.removeEventListener("pointercancel", this.onDocPointerUp, true);
    this.keys.dispose();
    doc.defaultView?.removeEventListener("blur", this.onWindowBlur);
    this.worldPress.set(false);
    this.resizeObserver?.disconnect();
    this.root.remove();
    this.toggle.remove();
  }
}
