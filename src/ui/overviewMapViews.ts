/**
 * The overview MAP window's views (#343 S6, S8 and S9): the View dropdown,
 * the selected view and what each view adds to the tower layer. A game builds
 * them with its readers of the tower and hands them to the window, which draws
 * the dropdown and the legends; a window built without them has no View
 * dropdown and draws the Edit view alone.
 *
 * Cost: the window asks `due`
 * once per open frame. With the Edit view selected it is a boolean.
 *
 * With the Hotel view selected it is the same plus two identity compares and
 * the game hour; only when the hour turns does it read the hotel rooms' states
 * again (one pass over the hotel rooms, `HotelWatch.check`), and the tower
 * layer repaints only when what it shows changed. The hotel rooms and their
 * rectangles are collected again only when the draw list rebuilds or the view
 * is chosen.
 *
 * With Eval or Pricing selected it is the same boolean, two identity compares
 * and the game hour. The game's tiers (one read per call) are read at most once a frame, and only when
 * a trigger set the one dirty flag: the view chosen from another view or the
 * window opened on it, a new game hour, a move of the rooms (a build, a
 * removal, a load, an undo or redo), or `towerTouched` (every applied rent
 * command or emergency answer, and a swap). A move of the rooms during a drag
 * that edits the tower waits for the end of the gesture. A switch between
 * Eval and Pricing reads nothing, since one read carries both. Matching the
 * rows to the rooms is one pass over the rooms, on a read or when the rooms
 * or the layout change, and a read that found nothing new repaints nothing.
 * Any room state the steps change (a score the hourly satisfaction pass
 * moved, a move-in, a fire) shows at most one game hour late.
 *
 * With Traffic or Occupancy selected it is the same boolean, the game hour
 * and two revision reads (the tower's, and on Traffic the meal overlay's).
 * The game's heat cells (one read) are read only when the
 * view was chosen, the hour turned or a revision moved (the triggers the
 * old main-view tint used; a move of the tower's revision during an editing
 * drag waits for its end) or on `towerTouched`, and placing them is one pass over the floors, on a
 * read that found something new or a new layout. A closed window never asks.
 *
 * Switching views never pauses the game; a game that wants that pauses it
 * itself.
 */
import type { FacilityKind, HeatmapMode, RenderRoomTiers } from "../render/renderModel";
import type { MapLayout } from "../render/overviewMap/geometry";
import {
  buildHotelMarks,
  HOTEL_LEGEND,
  HotelWatch,
  paintHotelMarks,
  type HotelRoom,
} from "../render/overviewMap/hotelView";
import type { MapPaintContext, PatternSource } from "../render/overviewMap/paint";
import {
  EVAL_LEGEND,
  paintTierMarks,
  PRICING_LEGEND,
  TierMarks,
  type TierRoom,
  type TierViewId,
} from "../render/overviewMap/tierView";
import type { MapViewId } from "../render/overviewMap/views";
import {
  HEAT_MODE_OF_VIEW,
  HeatMarks,
  OCCUPANCY_LEGEND,
  paintHeatMarks,
  TRAFFIC_LEGEND,
  type HeatCellView,
  type HeatViewId,
} from "../render/overviewMap/heatView";
import type { TemplateResult } from "lit-html";
import { MapLegend } from "./overviewMapLegend";
import { MapViewPicker } from "./overviewMapPicker";

/** The gesture id while no undo gesture is open. */
export const NO_MAP_GESTURE = 0;

/** No rated rooms: what Eval and Pricing paint without a tier reader. */
const NO_ROOM_TIERS: RenderRoomTiers = {
  size: 0,
  id: () => 0,
  floor: () => 0,
  x: () => 0,
  evalTier: () => "unrated",
  rentTier: () => "unpriced",
};

/** Game minutes in an hour: the Hotel view reads its rooms once per hour. */
export const MINUTES_PER_GAME_HOUR = 60;

/** The game hour a clock reading falls in, or -1 for a reading that is not a
 *  finite number (so a bad clock never reads as a new hour on every frame). */
export function gameHour(minutes: number): number {
  return Number.isFinite(minutes) ? Math.floor(minutes / MINUTES_PER_GAME_HOUR) : -1;
}

/** Whether a view paints the game's room tiers. */
export function isTierView(view: MapViewId): view is TierViewId {
  return view === "eval" || view === "pricing";
}

/** Whether a view paints the game's heat cells. */
export function isHeatView(view: MapViewId): view is HeatViewId {
  return view === "traffic" || view === "occupancy";
}

/** What the Traffic and Occupancy views read from the game. */
export interface MapHeatSource {
  /** The heat cells for `mode`. */
  cells(mode: HeatmapMode): ReadonlyArray<HeatCellView>;
  /** The tower's revision: it moves on every build and removal. */
  towerRevision(): number;
  /** The meal overlay's revision: it moves as diners come and go, which
   *  moves the congestion. */
  mealRevision(): number;
}

/** A room as the views read it. */
export type MapViewRoom = HotelRoom & TierRoom;

export interface MapViewsDeps {
  /** The view's own rooms array (never a copy made per call): its identity
   *  says when the rooms changed, and each entry's `state` is live. */
  rooms(): ReadonlyArray<MapViewRoom>;
  /** The game clock, in minutes since the start. */
  minutes(): number;
  /** A kind's height in floors (the catalog the view binds). */
  floorsOf(kind: FacilityKind): number;
  /** The room tiers. Without it
   *  Eval and Pricing paint nothing. */
  readonly tiers?: { read(): RenderRoomTiers } | null;
  /** The room with `id` among `rooms()`. */
  roomById(id: number): MapViewRoom | undefined;
  /** The heat cells. Without it Traffic and Occupancy paint
   *  nothing. */
  readonly heat?: MapHeatSource | null;
  /** The undo gesture under way : a build or bulldoze
   *  drag, a shaft extend, or `NO_MAP_GESTURE` (0) while none is open. */
  gesture?(): number;
}

export class OverviewMapViews {
  private readonly picker = new MapViewPicker(() => this.viewChosen());
  private readonly legends: Partial<Record<MapViewId, MapLegend>> = {
    eval: new MapLegend("eval", EVAL_LEGEND),
    pricing: new MapLegend("pricing", PRICING_LEGEND),
    hotel: new MapLegend("hotel", HOTEL_LEGEND),
    traffic: new MapLegend("traffic", TRAFFIC_LEGEND),
    occupancy: new MapLegend("occupancy", OCCUPANCY_LEGEND),
  };
  /** The window's draw, once it holds these views. */
  private redraw: (() => void) | null = null;
  /** A view was chosen: the next frame repaints whatever it shows. */
  private chosen = false;
  private readonly watch = new HotelWatch();
  private watchLayout: MapLayout | null = null;
  private watchRooms: unknown = null;
  private hour = -1;
  private readonly tierMarks = new TierMarks();
  /** The one dirty flag of the tier views: the next Eval or Pricing frame
   *  reads the tiers. It starts set. */
  private tierDirty = true;
  /** The rooms moved during this gesture: read once it is no longer the one
   *  under way. `NO_MAP_GESTURE` while nothing is held. */
  private tierHeld = NO_MAP_GESTURE;
  private tierRooms: unknown = null;
  private tierLayout: MapLayout | null = null;
  private tierHour = -1;
  private readonly heatMarks = new HeatMarks();
  /** What the kept heat cells were read for: the view (null when none is
   *  kept, or `towerTouched` asked for a read), the hour and the revisions. */
  private heatView: HeatViewId | null = null;
  private heatHour = -1;
  private heatTower = Number.NaN;
  private heatMeal = Number.NaN;
  private heatLayout: MapLayout | null = null;

  constructor(private readonly deps: MapViewsDeps) {}

  /** The window that draws these views: it calls back to draw again when
   *  the dropdown or a legend changed. */
  attach(redraw: () => void): void {
    this.redraw = redraw;
  }

  /** The View dropdown, which the window draws under its title bar. */
  pickerTemplate(): TemplateResult {
    return this.picker.template();
  }

  /** The legends, which the window draws over the top of its body. */
  legendsTemplate(): TemplateResult[] {
    return Object.values(this.legends).map((legend) => legend.template());
  }

  /** Draw again when a legend or the dropdown changed. */
  private changed(changed: boolean): void {
    if (changed) this.redraw?.();
  }

  /** The selected view. */
  get selected(): MapViewId {
    return this.picker.selected;
  }

  /** How far down the body the selected view's legend reaches, in CSS
   *  pixels, or 0 for a view with none (Edit). `width` is the body's width
   *  in any unit, so a new width measures again. Constant work on a steady
   *  frame. */
  legendReserve(width: number): number {
    return this.legends[this.selected]?.reach(width) ?? 0;
  }

  /** Something the tier or heat views show may have changed with no move of
   *  the rooms or the revision (an applied rent command or emergency answer,
   *  or a swap, whose new tower can repeat the old one's revision and hour):
   *  the next Eval, Pricing, Traffic or Occupancy frame reads again. The kept
   *  cells stay, so a read that finds them unchanged repaints nothing.
   *  Constant work. */
  towerTouched(): void {
    this.tierDirty = true;
    this.heatView = null;
  }

  /**
   * Called once per open frame, after the draw list's sync. True when the
   * tower layer must repaint for the selected view: it was just chosen, or
   * what the view shows changed. `rebuilt` says the draw list was rebuilt
   * (the window repaints anyway), so the view places its rooms again.
   */
  due(layout: MapLayout, rebuilt: boolean): boolean {
    const chosen = this.chosen;
    this.chosen = false;
    const view = this.selected;
    if (view === "hotel") return this.hotelDue(layout, rebuilt || chosen) || chosen;
    if (isTierView(view)) return this.tierDue(layout) || chosen;
    if (isHeatView(view)) return this.heatDue(layout, view) || chosen;
    return chosen;
  }

  /** Paint what the selected view adds over a freshly painted tower layer.
   *  Returns how many rooms it painted, so the window can draw the shafts
   *  over them again. */
  paintOver(ctx: MapPaintContext, patterns: PatternSource): number {
    const view = this.selected;
    if (view === "hotel") return paintHotelMarks(ctx, this.watch, patterns);
    if (isTierView(view)) return paintTierMarks(ctx, this.tierMarks, view, patterns);
    if (isHeatView(view)) return paintHeatMarks(ctx, this.heatMarks, patterns);
    return 0;
  }

  /** Whether the Hotel view shows something new: its rooms were collected
   *  again, or the game hour turned and a room's need changed. */
  private hotelDue(layout: MapLayout, fresh: boolean): boolean {
    const rooms = this.deps.rooms();
    const hour = gameHour(this.deps.minutes());
    if (fresh || layout !== this.watchLayout || rooms !== this.watchRooms) {
      this.watchLayout = layout;
      this.watchRooms = rooms;
      this.watch.watch(buildHotelMarks(layout, rooms, this.deps.floorsOf));
    } else if (hour === this.hour) {
      return false;
    }
    this.hour = hour;
    const changed = this.watch.check();
    if (changed)
      this.changed(
        this.legends.hotel?.count((i) =>
          HOTEL_LEGEND[i].needs.reduce((sum, need) => sum + this.watch.rooms(need), 0),
        ) ?? false,
      );
    return changed;
  }

  /** Whether the Eval or Pricing view shows something new: a read found
   *  new tiers, or the rows were placed again on new rooms or a new layout. */
  private tierDue(layout: MapLayout): boolean {
    const rooms = this.deps.rooms();
    const hour = gameHour(this.deps.minutes());
    let place = layout !== this.tierLayout;
    if (hour !== this.tierHour) {
      this.tierHour = hour;
      this.tierDirty = true;
    }
    if (rooms !== this.tierRooms) {
      this.tierRooms = rooms;
      place = true;
      // A move of the rooms during an editing drag waits for its end.
      const gesture = this.deps.gesture?.() ?? NO_MAP_GESTURE;
      if (gesture !== NO_MAP_GESTURE) this.tierHeld = gesture;
      else this.tierDirty = true;
    } else if (this.tierHeld !== NO_MAP_GESTURE && this.tierHeld !== (this.deps.gesture?.() ?? NO_MAP_GESTURE)) {
      this.tierDirty = true;
    }
    if (this.tierDirty) {
      // Read first: a read that throws leaves the flag set.
      const tiers = this.deps.tiers?.read() ?? NO_ROOM_TIERS;
      this.tierDirty = false;
      this.tierHeld = NO_MAP_GESTURE;
      if (this.tierMarks.take(tiers)) place = true;
    }
    if (!place) return false;
    this.tierLayout = layout;
    this.tierMarks.place(layout, rooms, this.deps.roomById, this.deps.floorsOf);
    this.countTiers();
    return true;
  }

  /** Whether the Traffic or Occupancy view shows something new: a read
   *  found new bands, or the floors were placed again on a new layout. */
  private heatDue(layout: MapLayout, view: HeatViewId): boolean {
    const heat = this.deps.heat;
    if (!heat) return false;
    const hour = gameHour(this.deps.minutes());
    const tower = heat.towerRevision();
    // Only the congestion moves with the diners.
    const meal = view === "traffic" ? heat.mealRevision() : 0;
    let place = layout !== this.heatLayout;
    const towerMoved = tower !== this.heatTower;
    const otherMoved = view !== this.heatView || hour !== this.heatHour || meal !== this.heatMeal;
    // A build or bulldoze drag moves the revision on every pointer move: a
    // move of the revision alone waits for the drag's end, as the tiers do.
    const held = towerMoved && !otherMoved && (this.deps.gesture?.() ?? NO_MAP_GESTURE) !== NO_MAP_GESTURE;
    if ((towerMoved || otherMoved) && !held) {
      // Read first: a read that throws leaves the keys as they were.
      const cells = heat.cells(HEAT_MODE_OF_VIEW[view]);
      this.heatView = view;
      this.heatHour = hour;
      this.heatTower = tower;
      this.heatMeal = meal;
      if (this.heatMarks.take(cells)) place = true;
    }
    if (!place) return false;
    this.heatLayout = layout;
    this.heatMarks.place(layout);
    const legend = view === "traffic" ? TRAFFIC_LEGEND : OCCUPANCY_LEGEND;
    this.changed(this.legends[view]?.count((i) => this.heatMarks.floorsIn(legend[i].band)) ?? false);
    return true;
  }

  /** Write the tier legends' counts from the placed rooms. */
  private countTiers(): void {
    const marks = this.tierMarks;
    const evalChanged = this.legends.eval?.count((i) => marks.evalRooms(EVAL_LEGEND[i].tier)) ?? false;
    const rentChanged = this.legends.pricing?.count((i) => marks.rentRooms(PRICING_LEGEND[i].tier)) ?? false;
    this.changed(evalChanged || rentChanged);
  }

  private viewChosen(): void {
    this.chosen = true;
    const view = this.selected;
    for (const [id, legend] of Object.entries(this.legends)) legend.setShown(id === view);
    // Another view holds none of a view's rooms.
    if (view !== "hotel") this.releaseHotel();
    if (!isTierView(view)) this.releaseTiers();
    // Traffic and Occupancy read different cells, so a switch reads again.
    this.releaseHeat();
    // The dropdown and the shown legend changed.
    this.redraw?.();
  }

  /** Let go of every view's rooms (the window closed), so an old tower's
   *  rooms are not held. The next `due` collects them again. */
  release(): void {
    this.releaseHotel();
    this.releaseTiers();
    this.releaseHeat();
  }

  /** Drop the heat cells; the next Traffic or Occupancy frame reads them. */
  private releaseHeat(): void {
    this.heatMarks.clear();
    this.heatView = null;
    this.heatLayout = null;
    // No old counts over the next view or tower before its first read.
    const traffic = this.legends.traffic?.count(() => 0) ?? false;
    const occupancy = this.legends.occupancy?.count(() => 0) ?? false;
    this.changed(traffic || occupancy);
  }

  private releaseHotel(): void {
    this.watch.clear();
    this.watchLayout = null;
    this.watchRooms = null;
  }

  /** Drop the tiers; the next Eval or Pricing frame reads them again. */
  private releaseTiers(): void {
    this.tierMarks.clear();
    this.tierDirty = true;
    this.tierHeld = NO_MAP_GESTURE;
    this.tierRooms = null;
    this.tierLayout = null;
    // No old counts over the next view or tower before its first read.
    this.countTiers();
  }
}
