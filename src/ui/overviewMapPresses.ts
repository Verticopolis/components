/**
 * The overview MAP window's pointer presses: a press on the map that drags
 * the view or taps to center it, and the page's presses around the window (a
 * world press held under it, a touch that is half of a world pinch, a press
 * that slid off the close button). `OverviewMapWindow` hands it its parts and
 * routes the map's pointer events and the page's capture-phase presses here.
 */
import type { ViewPlacement } from "../render/overviewMap/extent";
import {
  dragCenter,
  mapPointToCenter,
  rectContains,
  type MapLayout,
  type MapRect,
} from "../render/overviewMap/geometry";
import type { OverviewMapModel } from "../render/overviewMap/model";
import { viewMarkBand } from "../render/overviewMap/viewMark";
import type { PointerFocusClaim } from "./overviewMapKeys";
import type { WorldPress } from "./overviewMapWorldPress";
import {
  cameraCenter,
  clientToMap,
  grabRect,
  isPrimaryPress,
  type MapPress,
  MAP_MOUSE_TARGET_CSS,
  MAP_TOUCH_TARGET_CSS,
  noButtonHeld,
  pastTapSlop,
} from "./overviewMapInput";
import { tapReach } from "./overviewMapPick";
import type { MutableMapCamera, OverviewMapDeps } from "./overviewMapDeps";

/** What the presses read and move: the window's parts, its model and camera. */
export interface MapPressHost {
  readonly root: HTMLElement;
  readonly toggle: HTMLElement;
  readonly close: HTMLElement;
  /** The view canvas, which takes the map's presses. */
  readonly map: HTMLCanvasElement;
  readonly model: OverviewMapModel;
  readonly deps: Pick<OverviewMapDeps, "readCamera" | "moveCamera" | "tapped">;
  readonly cam: MutableMapCamera;
  /** The canvases' pixel ratio. */
  px(): number;
  readonly pointerFocus: PointerFocusClaim;
  readonly worldPress: WorldPress;
}

export class MapPresses {
  private press: MapPress | null = null;
  /** The last press began on the close button (see `pageUp`). */
  private closePressed = false;
  /** Touches down outside the window: while any is, a touch on the map is
   *  the other half of a world pinch and moves nothing. */
  private readonly outsideTouches = new Set<number>();

  constructor(private readonly host: MapPressHost) {}

  /** Drop the press under way: the window closed, moved or lost focus. */
  reset(): void {
    this.press = null;
  }

  /** The area that grabs the view: its outline, or the edge band when the view
   *  is past the edge, grown to a touch or mouse target. */
  private grabArea(layout: MapLayout, placement: ViewPlacement, touch: boolean): MapRect | null {
    const side = (touch ? MAP_TOUCH_TARGET_CSS : MAP_MOUSE_TARGET_CSS) * this.host.px();
    const mark = placement.outside === "none" ? placement.rect : viewMarkBand(layout, placement, this.host.px());
    return mark ? grabRect(mark, side) : null;
  }

  private mapPoint(e: PointerEvent): { x: number; y: number } {
    return clientToMap(this.host.map.getBoundingClientRect(), this.host.map, e.clientX, e.clientY);
  }

  /** Any press on the page. One outside the window and its button takes
   *  keyboard focus off the map (the world canvas cancels its presses, so the
   *  browser would leave focus here). A mouse or pen press there lets later
   *  pointers through the window and the button until it is released; a
   *  touch there makes a touch press on the map part of a world pinch. */
  pageDown(e: PointerEvent): void {
    const target = e.target;
    if (target !== this.host.map) this.host.pointerFocus.forget();
    // Only a mouse or pen press that started on the close button can slide
    // off it and leave it focused (see `pageUp`).
    this.closePressed = e.pointerType !== "touch" && target instanceof Node && this.host.close.contains(target);
    if (target instanceof Node && (this.host.root.contains(target) || this.host.toggle.contains(target))) return;
    const active = this.host.root.ownerDocument.activeElement;
    if (active instanceof HTMLElement && this.host.root.contains(active)) active.blur();
    if (e.pointerType === "touch") {
      // A primary touch starts a new gesture: any id left over from a lost
      // release is forgotten.
      if (e.isPrimary) this.outsideTouches.clear();
      this.outsideTouches.add(e.pointerId);
      this.dropStaleTouchPress(e);
    } else {
      // Any button: the world takes the middle button (a pan) and the right (an inspect) too.
      this.host.worldPress.set(true);
    }
  }

  /** A new touch ends a map press held by another touch (a pinch's other
   *  finger, or a release that was lost); a mouse or pen drag goes on. */
  private dropStaleTouchPress(e: PointerEvent): void {
    if (this.press?.pointerType === "touch" && this.press.pointerId !== e.pointerId) this.press = null;
  }

  /** Any release or cancel on the page. A touch only ends its own count; a
   *  mouse or pen release ends a held world press. */
  pageUp(e: PointerEvent): void {
    this.host.pointerFocus.released(e.pointerId);
    if (e.pointerType === "touch") {
      this.outsideTouches.delete(e.pointerId);
      return;
    }
    this.host.worldPress.set(false);
    // A mouse press on the close button that slid off and never clicked
    // would leave focus (and the game's keys) in the window. A real click
    // still fires after this.
    if (this.closePressed && this.host.root.ownerDocument.activeElement === this.host.close) this.host.close.blur();
    this.closePressed = false;
  }

  pointerDown(e: PointerEvent): void {
    this.host.pointerFocus.pressed(e.pointerId, e.pointerType, e.isPrimary);
    // A touch always reports the primary button; a pen's barrel or eraser
    // button, like a mouse's other buttons, is not the map's.
    if (!isPrimaryPress(e)) return;
    // A primary pointer means no other of its kind is down: a touch id, or a
    // press by another pointer of the same kind, is left over from a lost
    // release (a pen can get a new id per contact).
    if (e.isPrimary && this.press?.pointerType === e.pointerType && this.press.pointerId !== e.pointerId)
      this.press = null;
    if (e.pointerType === "touch" && e.isPrimary) this.outsideTouches.clear();
    const layout = this.host.model.layout;
    // A second finger while one is down is not the map's, and neither is a
    // finger while another is down on the world (a pinch); the same pointer
    // pressing again means its release was lost, so it starts over.
    if (!layout || (this.press && this.press.pointerId !== e.pointerId)) return;
    if (e.pointerType === "touch" && this.outsideTouches.size > 0) return;
    e.preventDefault();
    try {
      this.host.map.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic or already-released pointer cannot be captured; the press
      // still follows moves over the canvas.
    }
    const p = this.mapPoint(e);
    const placement = this.host.model.placement;
    const area = placement ? this.grabArea(layout, placement, e.pointerType !== "mouse") : null;
    this.press = {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      onMark: !!area && rectContains(area, p.x, p.y),
      start: p,
      last: p,
      layout,
      traveled: false,
    };
  }

  pointerMove(e: PointerEvent): void {
    const press = this.press;
    const layout = this.host.model.layout;
    // A mouse or pen whose release was lost (no capture, let go outside, or a
    // pen back in range with a new id) is only hovering, so the press ends.
    if (press && e.pointerType === press.pointerType && e.pointerType !== "touch" && noButtonHeld(e)) {
      this.press = null;
      return;
    }
    if (!press || press.pointerId !== e.pointerId || !layout) return;
    e.preventDefault();
    const p = this.mapPoint(e);
    if (press.layout !== layout) {
      // The map was rebuilt under the press (a resize, a new band): measure
      // from here on the new layout instead of jumping by the old scale.
      press.layout = layout;
      press.start = p;
      press.last = p;
      return;
    }
    if (pastTapSlop(press.start, p, this.host.px())) press.traveled = true;
    // Within the tap slop the press may still be a tap: nothing moves, and
    // `last` stays where it started, so the first drag move catches up.
    if (!press.traveled) return;
    if (press.onMark) {
      // The camera is read again for every move: the renderer clamps it, so
      // the view may stop short of the pointer at an edge and follows it
      // straight back off the edge.
      this.host.deps.readCamera(this.host.cam);
      this.host.deps.moveCamera(dragCenter(layout, cameraCenter(this.host.cam), press.last, p));
    } else this.host.deps.moveCamera(mapPointToCenter(layout, p.x, p.y));
    press.last = p;
  }

  /** The press ends. A tap that did not travel, the release included,
   *  centers the view where it lifted, on the view mark too, then tells
   *  `tapped` where (to open a card); a cancel never moves the camera. */
  end(e: PointerEvent, released: boolean): void {
    const press = this.press;
    if (!press || press.pointerId !== e.pointerId) return;
    this.press = null;
    const layout = this.host.model.layout;
    if (!released || press.traveled || !layout || press.layout !== layout) return;
    const p = this.mapPoint(e);
    if (pastTapSlop(press.start, p, this.host.px())) return;
    this.host.deps.moveCamera(mapPointToCenter(layout, p.x, p.y));
    this.host.deps.tapped?.({ layout, x: p.x, y: p.y, reach: tapReach(e.pointerType, this.host.px()) });
  }
}
