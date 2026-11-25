/**
 * Builds the merged geometry for one band of floors: every room's walls,
 * floor and furniture, the shafts' back panels, stairs and escalators, the
 * glazed side walls and the roofs, in one solid buffer, plus the night lights
 * in a second buffer. A band is {@link BAND_FLOORS} floors, so a change to
 * one room rebuilds one band and the whole tower draws in a few calls.
 *
 * World space: x is tiles from the lot's left edge, y is up in tiles with
 * floor 0 at y = 0, and z runs from the open front (0) to the back wall
 * (-{@link DEPTH}).
 */
import type { BufferGeometry } from "three";
import type { RenderSkyBridge, RenderTransport, RenderUnit, UnitState } from "../render/renderModel";
import { BoxWriter, FACE } from "./boxWriter";
import { lookFor, LOOKS_3D, type Rgb } from "./looks3d";

/** Floors per band. */
export const BAND_FLOORS = 8;
/** One story's height, in tiles. */
export const STORY = 3.4;
/** A room's depth, front to back wall, in tiles. */
export const DEPTH = 7;
/** The slab under each story. */
export const SLAB = 0.28;

const SLAB_RGB: Rgb = [118, 120, 126];
const DIVIDER: Rgb = [96, 98, 106];
const GLASS: Rgb = [150, 186, 214];
const MULLION: Rgb = [70, 80, 96];
const ROOF: Rgb = [104, 108, 116];
const PARAPET: Rgb = [140, 142, 148];
const FIRE: Rgb = [255, 120, 40];
const SHAFT_FACES = FACE.back | FACE.bottom;

/** The band a floor belongs to; basements fall in negative bands. */
export function bandOf(floor: number): number {
  return Math.floor(floor / BAND_FLOORS);
}

/** A row's runs of built tiles, `max` exclusive. */
export interface Run {
  readonly min: number;
  readonly max: number;
}

/** What one band is built from. */
export interface BandInput {
  readonly band: number;
  /** Units whose base floor is in the band. */
  readonly units: readonly RenderUnit[];
  /** Shafts that cross any floor of the band. */
  readonly transports: readonly RenderTransport[];
  /** Sky bridges on the band's floors. */
  readonly bridges: readonly RenderSkyBridge[];
  /** Each story's runs of built tiles, for the band's floors and the floor above it. */
  readonly rows: ReadonlyMap<number, readonly Run[]>;
  /** A unit's height in stories (the catalog's, or a tall lobby hall's). */
  readonly stories: (u: RenderUnit) => number;
  /** Whether a unit's people are in it now (its lights are on at night). */
  readonly isPresent: (u: { readonly state: UnitState }) => boolean;
}

export interface BandMeshes {
  readonly solid: BufferGeometry | null;
  readonly glow: BufferGeometry | null;
  /** Boxes written, for the gate's numbers. */
  readonly faces: number;
}

const y = (floor: number): number => floor * STORY;

/** Builds one band. Pure: the same input gives the same buffers. */
export function buildBand(input: BandInput): BandMeshes {
  const solid = new BoxWriter(input.units.length * 8 + 64);
  const glow = new BoxWriter(input.units.length + 8);
  for (const u of input.units) room(solid, glow, u, input);
  for (const t of input.transports) shaft(solid, t, input.band);
  for (const b of input.bridges) bridge(solid, b);
  shell(solid, input);
  return { solid: solid.geometry(), glow: glow.geometry(), faces: solid.faceCount + glow.faceCount };
}

function room(solid: BoxWriter, glow: BoxWriter, u: RenderUnit, input: BandInput): void {
  const look = lookFor(u.kind, u.state);
  const x0 = u.x;
  const x1 = u.x + u.width;
  const y0 = y(u.floor);
  const h = Math.max(1, input.stories(u)) * STORY;
  // A plain floor tile sits a little behind and below a room on the same
  // tiles, so a room drawn over it always wins.
  const behind = u.kind === "floor" ? 0.3 : 0;
  const light = nightLight(u, look.night, input.isPresent);
  solid.lit = light;
  solid.box(x0, y0 - SLAB - behind * 0.1, -DEPTH - behind, x1, y0, 0.15, SLAB_RGB, FACE.back);
  solid.box(x0, y0, -DEPTH - behind, x1, y0 + h - SLAB, -DEPTH + 0.2 - behind, look.wall, FACE.back | FACE.bottom);
  const story = STORY - SLAB;
  const furnished = u.kind !== "floor" && u.state !== "construction" && u.state !== "gutted";
  if (u.kind !== "floor") {
    solid.box(x0, y0, -DEPTH, x1, y0 + 0.03, 0, look.floor, ~FACE.top);
    solid.box(x1 - 0.12, y0, -DEPTH, x1, y0 + h - SLAB, 0, DIVIDER, FACE.back | FACE.bottom);
  }
  for (const p of furnished ? look.furnish(u.width, u.id) : []) {
    const px0 = x0 + Math.max(0, p.x);
    const px1 = Math.min(x1 - 0.12, x0 + p.x + p.w);
    const base = y0 + (p.top ?? 0) * story;
    solid.box(px0, base, -p.z1 * DEPTH, px1, base + p.h * story, -p.z0 * DEPTH, p.c, FACE.bottom);
  }
  solid.lit = null;
  if (light && u.kind !== "floor")
    glow.box(
      x0 + 0.25,
      y0 + 0.35 * story,
      -DEPTH + 0.2,
      x1 - 0.35,
      y0 + 0.9 * h - SLAB,
      -DEPTH + 0.24,
      light,
      ~FACE.front,
    );
}

/** The light a room gives off: fire always, its own light while its people are in. */
function nightLight(u: RenderUnit, own: Rgb | null, isPresent: BandInput["isPresent"]): Rgb | null {
  if (u.state === "fire") return FIRE;
  return isPresent(u) ? own : null;
}

/** A shaft's back panel and rails on the band's floors, or a flight's steps. */
function shaft(solid: BoxWriter, t: RenderTransport, band: number): void {
  const f0 = Math.max(t.bottom, band * BAND_FLOORS);
  const f1 = Math.min(t.top, (band + 1) * BAND_FLOORS - 1);
  if (f1 < f0) return;
  const look = LOOKS_3D[t.kind];
  if (t.kind === "stairs" || t.kind === "escalator") {
    // A flight climbs from its bottom floor to the one above it.
    if (t.bottom < band * BAND_FLOORS || t.bottom >= (band + 1) * BAND_FLOORS) return;
    const steps = 10;
    const run = t.width / steps;
    for (let i = 0; i < steps; i++) {
      const sx = t.x + i * run;
      solid.box(
        sx,
        y(t.bottom),
        -DEPTH * 0.55,
        sx + run,
        y(t.bottom) + ((i + 1) * STORY) / steps,
        -DEPTH * 0.25,
        look.wall,
        FACE.bottom | FACE.back,
      );
    }
    solid.box(t.x, y(t.bottom), -DEPTH * 0.58, t.x + t.width, y(t.bottom + 1), -DEPTH * 0.55, look.accent, SHAFT_FACES);
    return;
  }
  solid.box(t.x, y(f0) - SLAB, -DEPTH + 0.22, t.x + t.width, y(f1 + 1) - SLAB, -DEPTH + 0.5, look.wall, SHAFT_FACES);
  for (const rx of [t.x + 0.25, t.x + t.width - 0.4])
    solid.box(rx, y(f0) - SLAB, -DEPTH * 0.82, rx + 0.15, y(f1 + 1) - SLAB, -DEPTH * 0.8, look.accent, SHAFT_FACES);
}

/** A glazed walkway between two towers. */
function bridge(solid: BoxWriter, b: RenderSkyBridge): void {
  const y0 = y(b.floor);
  solid.box(b.from, y0 - SLAB, -DEPTH * 0.7, b.to, y0, -DEPTH * 0.3, SLAB_RGB, FACE.back);
  solid.box(b.from, y0, -DEPTH * 0.7, b.to, y0 + STORY - SLAB, -DEPTH * 0.68, GLASS, FACE.bottom);
  solid.box(b.from, y0 + STORY - SLAB, -DEPTH * 0.7, b.to, y0 + STORY, -DEPTH * 0.3, MULLION, FACE.bottom);
}

/** The side walls of each run, and a roof where the story above is open sky. */
function shell(solid: BoxWriter, input: BandInput): void {
  const first = input.band * BAND_FLOORS;
  for (let f = first; f < first + BAND_FLOORS; f++) {
    const runs = input.rows.get(f);
    if (!runs) continue;
    const y0 = y(f);
    for (const r of runs) {
      solid.box(r.min - 0.18, y0 - SLAB, -DEPTH, r.min, y0 + STORY - SLAB, 0.15, f < 0 ? SLAB_RGB : GLASS, FACE.back);
      solid.box(r.max, y0 - SLAB, -DEPTH, r.max + 0.18, y0 + STORY - SLAB, 0.15, f < 0 ? SLAB_RGB : GLASS, FACE.back);
      if (f < 0) continue;
      for (const open of uncovered(r, input.rows.get(f + 1) ?? [])) {
        const top = y(f + 1) - SLAB;
        solid.box(open.min, top, -DEPTH, open.max, top + SLAB, 0.15, ROOF, FACE.back | FACE.bottom);
        solid.box(open.min, top + SLAB, -0.05, open.max, top + SLAB + 0.5, 0.15, PARAPET, FACE.back | FACE.bottom);
      }
    }
  }
}

/** The parts of `run` that no run in `above` covers. */
export function uncovered(run: Run, above: readonly Run[]): Run[] {
  const out: Run[] = [];
  let at = run.min;
  for (const a of [...above].sort((p, q) => p.min - q.min)) {
    if (a.max <= at || a.min >= run.max) continue;
    if (a.min > at) out.push({ min: at, max: a.min });
    at = Math.max(at, a.max);
  }
  if (at < run.max) out.push({ min: at, max: run.max });
  return out;
}
