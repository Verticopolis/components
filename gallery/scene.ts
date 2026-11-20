/**
 * A small slice of a tower, drawn with the package's own painters in the order
 * the game layers them: the floors, the lobby halls, the rooms, the shafts, the
 * elevator cars, then the revolving doors between halls of different heights.
 * The gallery's scenes (`scenes.ts`) are hand-written fixtures in this shape.
 */
import { stampGroundEntrances } from "../lib/render/groundEntrances.js";
import { hallDoors, lobbyHalls } from "../lib/render/lobbyHalls.js";
import type { FacilityKind, RenderFacility, RenderTransport, UnitState } from "../lib/render/renderModel.js";
import { FLOOR, TILE } from "../lib/render/scale.js";
import { drawCar, drawTransport, drawUnit, type DrawCtx } from "../lib/render/sprites.js";
import { drawFloor } from "../lib/render/sprites/structure/shell.js";
import {
  drawLobbyEntrance,
  drawLobbyTile,
  lobbyVariant,
  type EntranceKind,
} from "../lib/render/sprites/structure/lobby.js";
import { drawTallLobbyEntrance, drawTallLobbyTile } from "../lib/render/sprites/structure/tallLobby.js";
import {
  QUARTER_TURN,
  drawRevolvingDoorBack,
  drawRevolvingDoorFront,
  drawRevolvingDoorMiddle,
} from "../lib/render/sprites/structure/revolvingDoor.js";

/** A run of lobby on one floor, `height` stories tall, `x1` its last column. */
export interface SceneHall {
  floor: number;
  x0: number;
  x1: number;
  height: number;
}

/** A room standing on `floor` at column `x`. */
export interface SceneRoom {
  kind: FacilityKind;
  floor: number;
  x: number;
  state?: UnitState;
  occupants?: number;
  subtype?: string;
}

/** An elevator car stopped or moving at `at` (a floor, fractional between). */
export interface SceneCar {
  at: number;
  riders: number;
  dir: 1 | -1 | 0;
}

/** A stairway, escalator or elevator shaft from `bottom` to `top`. */
export interface SceneShaft {
  kind: FacilityKind;
  x: number;
  bottom: number;
  top: number;
  cars?: SceneCar[];
  /** Floors an express car passes without stopping. */
  skip?: number[];
  /** A one-story flight beside a venue that winds (Modern). */
  winds?: boolean;
}

export interface Scene {
  title: string;
  caption: string;
  /** Where the player's manual covers it: a page path and anchor (manual.ts). */
  manual?: string;
  /** Columns across. */
  width: number;
  bottom: number;
  top: number;
  halls: SceneHall[];
  rooms: SceneRoom[];
  shafts: SceneShaft[];
}

export type Facts = (kind: FacilityKind) => RenderFacility;

/** The scene's size in world pixels. */
export function sceneSize(scene: Scene): { w: number; h: number } {
  return { w: scene.width * TILE, h: (scene.top - scene.bottom + 1) * FLOOR };
}

/** Paint `scene` at world scale from the context's origin; the caller sets
 *  any magnification on the context first. */
export function paintScene(d: DrawCtx, scene: Scene, facts: Facts): void {
  const { ctx } = d;
  const yTop = (floor: number): number => (scene.top - floor) * FLOOR;
  for (let f = scene.bottom; f <= scene.top; f++) drawFloor(ctx, 0, yTop(f), scene.width * TILE, FLOOR);
  paintHalls(d, scene, yTop);
  let id = 1;
  for (const r of scene.rooms) {
    const f = facts(r.kind);
    const floors = f.floors ?? 1;
    const unit = {
      id: id++,
      kind: r.kind,
      floor: r.floor,
      x: r.x,
      width: f.width,
      state: r.state ?? "occupied",
      occupants: r.occupants ?? f.population,
      subtype: r.subtype,
    };
    drawUnit(d, unit, r.x * TILE, yTop(r.floor + floors - 1), f.width * TILE, floors * FLOOR);
  }
  for (const s of scene.shafts) paintShaft(ctx, s, facts, yTop, id++);
  paintDoors(d, scene, yTop);
}

function paintHalls(d: DrawCtx, scene: Scene, yTop: (floor: number) => number): void {
  const groundTiles: number[] = [];
  for (const h of scene.halls) if (h.floor === 1) for (let x = h.x0; x <= h.x1; x++) groundTiles.push(x);
  groundTiles.sort((a, b) => a - b);
  const entrances = new Map<number, EntranceKind>();
  stampGroundEntrances(entrances, groundTiles, null, []);
  for (const h of scene.halls) {
    const ground = h.floor === 1;
    const y = yTop(h.floor + h.height - 1);
    const hh = h.height * FLOOR;
    for (let x = h.x0; x <= h.x1; x++) {
      const slot = ground ? entrances.get(x) : undefined;
      const sx = x * TILE;
      if (h.height === 1) {
        if (slot) drawLobbyEntrance(d, slot, sx, y, TILE, hh);
        else drawLobbyTile(d, sx, y, TILE, hh, lobbyVariant(x), ground);
      } else if (slot) {
        drawTallLobbyEntrance(d, slot, sx, y, TILE, hh, h.height);
      } else {
        drawTallLobbyTile(d, sx, y, TILE, hh, lobbyVariant(x), ground, h.height);
      }
    }
  }
}

function paintShaft(
  ctx: CanvasRenderingContext2D,
  s: SceneShaft,
  facts: Facts,
  yTop: (floor: number) => number,
  id: number,
): void {
  const f = facts(s.kind);
  const cars = s.cars ?? [];
  const t: RenderTransport = {
    id,
    kind: s.kind,
    x: s.x,
    width: f.width,
    bottom: s.bottom,
    top: s.top,
    cars: cars.length,
    skipFloors: s.skip,
    carPositions: cars.map((c) => c.at),
    carDir: cars.map((c) => c.dir),
  };
  const sx = s.x * TILE;
  const w = f.width * TILE;
  drawTransport(ctx, t, sx, yTop(s.top), w, FLOOR, s.winds ?? false);
  cars.forEach((c, i) => {
    ctx.save();
    ctx.translate(sx, Math.round(yTop(c.at)));
    const arrow = ARROW[c.dir];
    drawCar(ctx, id * 7 + i, w, FLOOR, c.riders, arrow, false, s.kind);
    ctx.restore();
  });
}

/** The lantern each travel direction lights on a car. */
const ARROW = { 1: "up", [-1]: "down", 0: null } as const;

/** The revolving doors where two halls of different heights meet (Modern). */
function paintDoors(d: DrawCtx, scene: Scene, yTop: (floor: number) => number): void {
  const quads = scene.halls.filter((h) => h.height > 1).flatMap((h) => [h.floor, h.x0, h.x1, h.height]);
  const halls = lobbyHalls(quads);
  const lobbyAt = (floor: number, x: number): boolean =>
    scene.halls.some((h) => h.floor === floor && h.x0 <= x && x <= h.x1);
  const { ctx, lit } = d;
  for (const door of hallDoors(halls, lobbyAt)) {
    const top = yTop(door.floor + door.tall - 1);
    const foot = top + door.tall * FLOOR - 3;
    const cx = door.x * TILE;
    const angle = QUARTER_TURN / 2;
    const step = { y: top + (door.tall - door.short) * FLOOR, side: door.tallOnLeft ? -1 : 1 } as const;
    drawRevolvingDoorBack(ctx, cx, foot, top, angle, lit, step);
    drawRevolvingDoorMiddle(ctx, cx, foot, angle, lit);
    drawRevolvingDoorFront(ctx, cx, foot, lit);
  }
}
