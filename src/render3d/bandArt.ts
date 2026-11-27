/**
 * The game's own room art on the back walls of the Tower in 3D: one canvas
 * per band of floors, painted with the side view's painters (`drawUnit`), and
 * one quad per room that shows its part of the canvas. The rooms read the
 * way they do in the game (windows, desks, beds, signs, the people at work),
 * while the slabs, the shafts, the cars and the people walking give the depth.
 *
 * A band repaints when its rooms change and on a slow rotation, so lights,
 * occupancy and signs follow the game while the window is open.
 */
import {
  MeshBasicMaterial,
  Mesh,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  LinearMipmapLinearFilter,
  NearestFilter,
  SRGBColorSpace,
} from "three";
import type { RenderUnit } from "../render/renderModel";
import { FLOOR, TILE } from "../render/scale";
import { drawUnit, type DrawCtx } from "../render/sprites";
import { BAND_FLOORS, DEPTH, SLAB, STORY } from "./bandGeometry";

/** How far in front of the back wall the art hangs, in tiles. */
const ART_Z = -DEPTH + 0.22;
/** The widest canvas a band paints, in pixels; wider lots paint at a smaller scale. */
const MAX_WIDTH = 4096;

/** The light and time the painters draw with. */
export interface ArtPaint {
  readonly lit: boolean;
  readonly hour: number;
  /** Seconds, for the painters' flicker. */
  readonly anim: number;
}

/** Where a band's rooms sit on its canvas. */
interface Frame {
  readonly x0: number;
  /** The floor at the canvas's top edge (exclusive). */
  readonly top: number;
  readonly floors: number;
  readonly tiles: number;
  readonly scale: number;
}

/** A unit's height in stories. */
export type Stories = (u: RenderUnit) => number;

/** One band's painted back walls. */
export class BandArt {
  readonly canvas = document.createElement("canvas");
  readonly texture: CanvasTexture;
  geometry: BufferGeometry | null = null;
  private frame: Frame | null = null;

  constructor(
    readonly band: number,
    private readonly detail: number,
  ) {
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = LinearMipmapLinearFilter;
    this.texture.anisotropy = 4;
  }

  /** Lays the band's rooms out on the canvas and builds their quads. */
  layout(units: readonly RenderUnit[], stories: Stories): void {
    this.geometry?.dispose();
    this.geometry = null;
    this.frame = frameFor(units, stories, this.band, this.detail);
    const f = this.frame;
    if (!f) return;
    const w = Math.max(1, Math.ceil(f.tiles * TILE * f.scale));
    const h = Math.max(1, Math.ceil(f.floors * FLOOR * f.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      // A new size needs a new GPU texture.
      this.texture.dispose();
    }
    this.geometry = quads(units, stories, f, this.band);
  }

  /** Paints the band's rooms as the side view draws them. */
  paint(units: readonly RenderUnit[], stories: Stories, look: ArtPaint): void {
    const f = this.frame;
    if (!f) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = look.lit ? "#141a2c" : "#c8c4b8";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(f.scale, 0, 0, f.scale, 0, 0);
    const d: DrawCtx = { ctx, lit: look.lit, anim: look.anim, hour: look.hour, staffed: true };
    // Bare floors first: a room built on them paints over.
    for (const u of [...units].sort((a, b) => Number(b.kind === "floor") - Number(a.kind === "floor"))) {
      if (!inBand(u, this.band)) continue;
      const r = pixelRect(u, stories(u), f);
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      try {
        drawUnit(d, u, r.x, r.y, r.w, r.h);
      } catch {
        // A painter that can't draw this room leaves its wall plain.
      }
      ctx.restore();
    }
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.geometry?.dispose();
    this.texture.dispose();
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}

/** Paints `band`'s rooms and builds the mesh that hangs them, or null for a band with no rooms. */
export function hangArt(
  band: number,
  units: readonly RenderUnit[],
  stories: Stories,
  look: ArtPaint,
  tint: number,
): { readonly paint: BandArt; readonly mesh: Mesh } | null {
  const paint = new BandArt(band, 1);
  paint.layout(units, stories);
  if (!paint.geometry) {
    paint.dispose();
    return null;
  }
  paint.paint(units, stories, look);
  return { paint, mesh: new Mesh(paint.geometry, new MeshBasicMaterial({ map: paint.texture, color: tint })) };
}

function inBand(u: RenderUnit, band: number): boolean {
  return Math.floor(u.floor / BAND_FLOORS) === band;
}

/** The canvas frame for a band's rooms, or null when it has none. */
function frameFor(units: readonly RenderUnit[], stories: Stories, band: number, detail: number): Frame | null {
  let x0 = Infinity;
  let x1 = -Infinity;
  let top = -Infinity;
  const bottom = band * BAND_FLOORS;
  for (const u of units) {
    if (!inBand(u, band)) continue;
    x0 = Math.min(x0, u.x);
    x1 = Math.max(x1, u.x + u.width);
    top = Math.max(top, u.floor + Math.max(1, stories(u)));
  }
  if (!(x1 > x0)) return null;
  const tiles = x1 - x0;
  const scale = Math.min(detail, MAX_WIDTH / (tiles * TILE));
  return { x0, top, floors: top - bottom, tiles, scale };
}

/** A unit's rectangle on the canvas, in world pixels (before the canvas scale). */
function pixelRect(u: RenderUnit, n: number, f: Frame): { x: number; y: number; w: number; h: number } {
  const floors = Math.max(1, n);
  return {
    x: (u.x - f.x0) * TILE,
    y: (f.top - (u.floor + floors)) * FLOOR,
    w: u.width * TILE,
    h: floors * FLOOR,
  };
}

/** How many art pixels at a room's bottom edge carpet its 3D floor. */
const CARPET_PX = 3;

/**
 * Two quads per room: its art on the back wall, and its bottom few rows of
 * art stretched over the room's floor toward the open front, so the floor
 * wears the room's own carpet or tiles. UVs are on the band's canvas.
 */
function quads(units: readonly RenderUnit[], stories: Stories, f: Frame, band: number): BufferGeometry | null {
  const list = units.filter((u) => inBand(u, band));
  if (!list.length) return null;
  const n = list.length * 2;
  const pos = new Float32Array(n * 12);
  const uv = new Float32Array(n * 8);
  const nor = new Float32Array(n * 12);
  const idx = new Uint32Array(n * 6);
  const cw = f.tiles * TILE;
  const ch = f.floors * FLOOR;
  let q = 0;
  const quad = (p: number[], t: number[], normal: number[]): void => {
    pos.set(p, q * 12);
    uv.set(t, q * 8);
    nor.set([...normal, ...normal, ...normal, ...normal], q * 12);
    const b = q * 4;
    idx.set([b, b + 1, b + 2, b, b + 2, b + 3], q * 6);
    q++;
  };
  for (const u of list) {
    const tall = Math.max(1, stories(u));
    const r = pixelRect(u, tall, f);
    const x0 = u.x;
    const x1 = u.x + u.width;
    const y0 = u.floor * STORY;
    const y1 = (u.floor + tall) * STORY - SLAB;
    const u0 = r.x / cw;
    const u1 = (r.x + r.w) / cw;
    // Canvas rows run down, texture v runs up.
    const v0 = 1 - (r.y + r.h) / ch;
    const v1 = 1 - r.y / ch;
    // A bare floor hangs a hair behind, so a room on the same tiles wins.
    const z = u.kind === "floor" ? ART_Z - 0.04 : ART_Z;
    quad([x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z], [u0, v0, u1, v0, u1, v1, u0, v1], [0, 0, 1]);
    const fy = y0 + (u.kind === "floor" ? 0.03 : 0.05);
    const vc = v0 + CARPET_PX / ch;
    quad([x0, fy, 0, x1, fy, 0, x1, fy, z, x0, fy, z], [u0, v0, u1, v0, u1, vc, u0, vc], [0, 1, 0]);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("normal", new BufferAttribute(nor, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(new BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}
