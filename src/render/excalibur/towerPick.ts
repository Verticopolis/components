import type * as ex from "excalibur";
import type { FacilityKind } from "../renderModel";
import { FLOOR, TILE } from "../scale";
import type { TowerEngine } from "./TowerEngine";

/** Entity picking for {@link TowerEngine}: what the pointer is over, found on
 *  demand so a pointer handler that never asks costs no transport scan. */

/** What the pointer is over (see pickEntityAt), with its cell: a floor or
 *  lobby tile has no id in the view (#1417). */
export interface Picked {
  type: "unit" | "transport";
  id: number;
  kind: FacilityKind;
  cell?: { floor: number; x: number };
}

/** The entity under one pointer event, resolved on the first call and kept for
 *  later calls. The pointer hooks take this in place of a resolved pick, so a
 *  hover or drag that ignores the entity never walks the transport actors. */
export type PickAt = () => Picked | null;

/** World point → grid cell, the single inverse of worldX/worldYTop, shared by
 *  pointer handling and the pick fallback so the two can't drift. */
export function worldToCell(world: ex.Vector): { tile: number; floor: number } {
  return cellAt(world.x, world.y);
}

function cellAt(x: number, y: number): { tile: number; floor: number } {
  return { tile: Math.floor(x / TILE), floor: Math.ceil(-y / FLOOR) };
}

/** Top-most entity under the point: transports by collider (they overlay units), units by grid. */
export function pickEntityAt(engine: TowerEngine, world: ex.Vector): Picked | null {
  return pickAtPoint(engine, world.x, world.y);
}

function pickAtPoint(engine: TowerEngine, x: number, y: number): Picked | null {
  let best: Picked | null = null;
  let bestZ = -Infinity;
  for (const [id, a] of engine.transportActors) {
    if (a.z >= bestZ && a.contains(x, y)) {
      const t = engine.sim.tower.getTransport(id);
      if (t) {
        best = { type: "transport", id, kind: t.kind };
        bestZ = a.z;
      }
    }
  }
  // Every unit kind resolves by grid lookup: the tile index is
  // footprint-complete and rooms sit below transports, so one O(1) unitAt
  // matches the old O(rooms) actor scan, free of the render's actor model.
  if (!best) {
    const { tile, floor } = cellAt(x, y);
    const u = engine.sim.tower.unitAt(floor, tile);
    if (u) best = { type: "unit", id: u.id, kind: u.kind, cell: { floor, x: tile } };
  }
  return best;
}

/** A {@link PickAt} for the world point as it is now. The point is copied, so
 *  a later call (a long-press timer) picks where the event landed. */
export function lazyPick(engine: TowerEngine, world: ex.Vector): PickAt {
  const x = world.x;
  const y = world.y;
  let resolved = false;
  let hit: Picked | null = null;
  return () => {
    if (!resolved) {
      hit = pickAtPoint(engine, x, y);
      resolved = true;
    }
    return hit;
  };
}
