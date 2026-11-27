/**
 * The openings a floor slab leaves for what climbs through it: an elevator
 * shaft's cars, and a stairway's or an escalator's steps and climbers. A
 * slab (`bandGeometry.ts`) and the carpet the room art lays on it
 * (`bandArt.ts`) are cut around these, so nothing moves through a solid
 * floor.
 */
import type { RenderTransport } from "../render/renderModel";
import { RUN_FOOT_PX, RUN_HEAD_PX } from "../render/climbPath";
import { TILE } from "../render/scale";
import { FLIGHT_FAR, FLIGHT_NEAR } from "./flights3d";

/** An opening in a slab: tiles `x0` to `x1`, depths `z0` (back) to `z1` (front). */
export interface Well {
  readonly x0: number;
  readonly x1: number;
  readonly z0: number;
  readonly z1: number;
}

/** A piece of a cut slab: tiles `x0` to `x1`, depths `z0` to `z1`. */
export type SlabPiece = Well;

/** How much of the room's depth an elevator car fills, from the open front (`cabs3d.ts`). */
const CAR_NEAR = 0.42;
const CAR_FAR = 0.86;

/** The openings in the slab under `floor`: each shaft or flight that climbs up through it. */
export function wellsAt(transports: readonly RenderTransport[], floor: number, depth: number): Well[] {
  const out: Well[] = [];
  for (const t of transports) {
    if (!(t.bottom < floor && floor <= t.top)) continue;
    if (t.kind === "stairs" || t.kind === "escalator")
      out.push({
        x0: t.x + RUN_FOOT_PX / TILE,
        x1: t.x + t.width - RUN_HEAD_PX / TILE,
        z0: -depth * FLIGHT_FAR,
        z1: -depth * FLIGHT_NEAR,
      });
    else out.push({ x0: t.x + 0.1, x1: t.x + t.width - 0.1, z0: -depth * CAR_FAR, z1: -depth * CAR_NEAR });
  }
  return out;
}

/**
 * Cuts the slab over tiles `x0` to `x1` and depths `z0` to `z1` around
 * `wells`: whole pieces where no well falls, and a strip behind and a strip
 * in front of each well. Overlapping wells open their union.
 */
export function cutSlab(x0: number, x1: number, z0: number, z1: number, wells: readonly Well[]): SlabPiece[] {
  const open = wells
    .filter((w) => w.x1 > x0 && w.x0 < x1)
    .map((w) => ({ x0: Math.max(x0, w.x0), x1: Math.min(x1, w.x1), z0: Math.max(z0, w.z0), z1: Math.min(z1, w.z1) }))
    .sort((a, b) => a.x0 - b.x0);
  if (!open.length) return [{ x0, x1, z0, z1 }];
  const merged: { x0: number; x1: number; z0: number; z1: number }[] = [];
  for (const w of open) {
    const last = merged[merged.length - 1];
    if (last && w.x0 <= last.x1) {
      last.x1 = Math.max(last.x1, w.x1);
      last.z0 = Math.min(last.z0, w.z0);
      last.z1 = Math.max(last.z1, w.z1);
    } else merged.push({ ...w });
  }
  const out: SlabPiece[] = [];
  let at = x0;
  for (const w of merged) {
    if (w.x0 > at) out.push({ x0: at, x1: w.x0, z0, z1 });
    if (w.z0 > z0) out.push({ x0: w.x0, x1: w.x1, z0, z1: w.z0 });
    if (w.z1 < z1) out.push({ x0: w.x0, x1: w.x1, z0: w.z1, z1 });
    at = w.x1;
  }
  if (at < x1) out.push({ x0: at, x1, z0, z1 });
  return out;
}
