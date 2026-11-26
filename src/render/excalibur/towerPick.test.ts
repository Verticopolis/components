import { describe, it, expect, vi } from "vitest";
import * as ex from "excalibur";
import { FLOOR, TILE } from "../scale";
import { lazyPick, pickEntityAt } from "./towerPick";

/**
 * Picking for the tower renderer against a minimal fake engine: z-ordering and
 * the transport-over-unit precedence, not merely that a hit was found, and a
 * lazy pick that scans nothing until a hook asks.
 */

/** A fake TowerEngine carrying just the fields picking reads. */
function eng(over: Record<string, any> = {}): any {
  return { transportActors: new Map(), sim: { tower: { highestFloor: 40, lowestFloor: 1 } }, ...over };
}

describe("pickEntityAt: transports by collider, every unit by grid lookup", () => {
  const world = ex.vec(100, -100);
  const hit = (z: number) => ({ z, contains: () => true });
  const miss = (z: number) => ({ z, contains: () => false });

  it("prefers a transport whose collider contains the point over the unit beneath", () => {
    const e = eng({
      transportActors: new Map([[7, hit(1)]]),
      sim: {
        tower: {
          highestFloor: 40,
          lowestFloor: 1,
          getTransport: () => ({ kind: "elevatorStandard" }),
          unitAt: () => ({ id: 3, kind: "office" }),
        },
      },
    });
    expect(pickEntityAt(e, world)).toEqual({ type: "transport", id: 7, kind: "elevatorStandard" });
  });

  it("resolves any unit kind by unitAt when no transport contains the point", () => {
    const e = eng({
      transportActors: new Map([[7, miss(1)]]),
      sim: {
        tower: {
          highestFloor: 40,
          lowestFloor: 1,
          getTransport: () => undefined,
          unitAt: () => ({ id: 3, kind: "office" }),
        },
      },
    });
    expect(pickEntityAt(e, world)).toEqual({ type: "unit", id: 3, kind: "office", cell: { floor: 3, x: 10 } });
  });

  it("returns null when nothing is under the point and the tile is empty", () => {
    const e = eng({
      transportActors: new Map(),
      sim: { tower: { highestFloor: 40, lowestFloor: 1, getTransport: () => undefined, unitAt: () => undefined } },
    });
    expect(pickEntityAt(e, ex.vec(1, -1))).toBeNull();
  });

  it("a stale transport actor falls through to the unit, and a z-tie keeps last-wins", () => {
    // Stale: the collider still contains the point but the transport is gone
    // from the sim; the guard must fall through to the grid lookup.
    const stale = eng({
      transportActors: new Map([[7, hit(1)]]),
      sim: {
        tower: {
          highestFloor: 40,
          lowestFloor: 1,
          getTransport: () => undefined,
          unitAt: () => ({ id: 3, kind: "office" }),
        },
      },
    });
    expect(pickEntityAt(stale, world)).toEqual({ type: "unit", id: 3, kind: "office", cell: { floor: 3, x: 10 } });

    // Two overlapping transports at the same z: the >= comparison keeps the
    // later map entry, the same tie-break the actor scan always had.
    const kinds = new Map([
      [1, { kind: "elevatorStandard" }],
      [2, { kind: "elevatorExpress" }],
    ]);
    const tie = eng({
      transportActors: new Map([
        [1, hit(1)],
        [2, hit(1)],
      ]),
      sim: {
        tower: {
          highestFloor: 40,
          lowestFloor: 1,
          getTransport: (id: number) => kinds.get(id),
          unitAt: () => undefined,
        },
      },
    });
    expect(pickEntityAt(tie, world)!.id).toBe(2);
  });

  it("resolves rooms through the tower's cell lookup with zero render actors, at exact pixel edges", () => {
    // Picking reads only the sim's tile index (unitAt), never the room actor
    // layer. That the index covers every story of a tall room is the game's to
    // check.
    const cells = new Map<string, { id: number; kind: string }>();
    for (let x = 140; x < 149; x++) cells.set(`2:${x}`, { id: 7, kind: "office" });
    cells.set("2:149", { id: 0, kind: "floor" });
    cells.set("0:120", { id: 0, kind: "floor" });
    const unitAt = vi.fn((floor: number, x: number) => cells.get(`${floor}:${x}`));
    const e = eng({ transportActors: new Map(), sim: { tower: { highestFloor: 40, lowestFloor: 1, unitAt } } });

    const at = (tile: number, floor: number) => pickEntityAt(e, ex.vec((tile + 0.5) * TILE, -(floor - 0.5) * FLOOR));
    expect(at(141, 2)).toEqual({ type: "unit", id: 7, kind: "office", cell: { floor: 2, x: 141 } });
    expect(unitAt).toHaveBeenLastCalledWith(2, 141);
    expect(at(50, 20)).toBeNull(); // open sky

    // Exact pixel-boundary semantics (the deliberate tie-break recorded in
    // the backlog): a cell owns its left pixel edge; the right edge and the
    // line below belong to the neighbor. Basements and out-of-grid points
    // resolve through the same total lookup, no clamping, no throw.
    const atWorld = (x: number, y: number) => pickEntityAt(e, ex.vec(x, y));
    const midFloor2 = -(2 - 0.5) * FLOOR;
    expect(atWorld(140 * TILE, midFloor2)!.id).toBe(7); // left edge is the office's
    expect(atWorld(149 * TILE, midFloor2)!.kind).toBe("floor"); // right edge is the neighbor's
    expect(atWorld(120.5 * TILE, 0)!.kind).toBe("floor"); // the ground line maps to B1 (ceil(-0) keys as floor 0)
    expect(atWorld(-5, midFloor2)).toBeNull(); // left of the lot
    expect(atWorld(400 * TILE, midFloor2)).toBeNull(); // right of the lot
    expect(atWorld(120.5 * TILE, -150 * FLOOR)).toBeNull(); // far above the build cap
  });
});

describe("lazyPick: one scan, only when asked", () => {
  const world = ex.vec(100, -100);

  it("walks no transport actor until it is called, then once for any number of calls", () => {
    const contains = vi.fn(() => true);
    const e = eng({
      transportActors: new Map([[7, { z: 1, contains }]]),
      sim: { tower: { getTransport: () => ({ kind: "elevatorStandard" }), unitAt: () => undefined } },
    });
    const pick = lazyPick(e, world);
    expect(contains).not.toHaveBeenCalled();
    expect(pick()).toEqual({ type: "transport", id: 7, kind: "elevatorStandard" });
    expect(pick()).toEqual({ type: "transport", id: 7, kind: "elevatorStandard" });
    expect(contains).toHaveBeenCalledOnce();
  });

  it("keeps a miss too, and picks the point it was made for after the vector changes", () => {
    const unitAt = vi.fn(() => undefined);
    const e = eng({ sim: { tower: { getTransport: () => undefined, unitAt } } });
    const point = ex.vec(10.5 * TILE, -(3 - 0.5) * FLOOR);
    const pick = lazyPick(e, point);
    point.x = 50 * TILE; // Excalibur may reuse an event's vector
    expect(pick()).toBeNull();
    expect(pick()).toBeNull();
    expect(unitAt).toHaveBeenCalledOnce();
    expect(unitAt).toHaveBeenCalledWith(3, 10);
  });

  it("answers what pickEntityAt answers for the same point", () => {
    const e = eng({ sim: { tower: { getTransport: () => undefined, unitAt: () => ({ id: 3, kind: "office" }) } } });
    expect(lazyPick(e, world)()).toEqual(pickEntityAt(e, world));
  });
});
