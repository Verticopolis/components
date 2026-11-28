/**
 * Writes axis-aligned boxes into one growable, indexed vertex buffer with a
 * color per vertex, so a whole band of floors draws in one call. Each box is
 * 24 vertices (4 per face, so faces stay flat-shaded) and 36 indices; faces
 * the camera can never see (the bottom, and the back behind the back wall)
 * can be left out with `skip`.
 */
import { BufferAttribute, BufferGeometry } from "three";
import type { Rgb } from "./looks3d";

/** Faces of a box, as bits for `skip`. */
export const FACE = { left: 1, right: 2, bottom: 4, top: 8, back: 16, front: 32 } as const;

// Each face: its normal, then its four corners as [x, y, z] picks of
// (min = 0, max = 1), wound counterclockwise seen from outside.
const FACES: ReadonlyArray<{
  readonly bit: number;
  readonly n: readonly [number, number, number];
  readonly c: ReadonlyArray<readonly [0 | 1, 0 | 1, 0 | 1]>;
}> = [
  {
    bit: FACE.left,
    n: [-1, 0, 0],
    c: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    bit: FACE.right,
    n: [1, 0, 0],
    c: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    bit: FACE.bottom,
    n: [0, -1, 0],
    c: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    bit: FACE.top,
    n: [0, 1, 0],
    c: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    bit: FACE.back,
    n: [0, 0, -1],
    c: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
  {
    bit: FACE.front,
    n: [0, 0, 1],
    c: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
];

/**
 * Each box also gets a night color, drawn unlit after dark: a box written
 * while {@link BoxWriter.lit} is set takes on that light, any other box goes
 * dark blue. `geometry().userData` holds both color sets as `day` and `night`.
 */
export class BoxWriter {
  /** The light the next boxes glow with at night, or null for dark. */
  lit: Rgb | null = null;

  private pos: Float32Array;
  private nor: Float32Array;
  private col: Float32Array;
  private nightCol: Float32Array;
  private idx: Uint32Array;
  private verts = 0;
  private indices = 0;

  constructor(boxes = 256) {
    this.pos = new Float32Array(boxes * 72);
    this.nor = new Float32Array(boxes * 72);
    this.col = new Float32Array(boxes * 72);
    this.nightCol = new Float32Array(boxes * 72);
    this.idx = new Uint32Array(boxes * 36);
  }

  /** The number of boxes' worth of faces written so far (6 faces per box). */
  get faceCount(): number {
    return this.verts / 4;
  }

  /** Adds the box between two corners, colored `rgb` (0 to 255), less the `skip` faces. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, rgb: Rgb, skip = 0): void {
    if (x1 <= x0 || y1 <= y0 || z1 <= z0) return;
    this.reserve(24, 36);
    const xs = [x0, x1] as const;
    const ys = [y0, y1] as const;
    const zs = [z0, z1] as const;
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const [nr, ng, nb] = this.nightOf(r, g, b);
    for (const f of FACES) {
      if (skip & f.bit) continue;
      const base = this.verts;
      for (const [cx, cy, cz] of f.c) {
        const o = this.verts * 3;
        this.pos[o] = xs[cx];
        this.pos[o + 1] = ys[cy];
        this.pos[o + 2] = zs[cz];
        this.nor[o] = f.n[0];
        this.nor[o + 1] = f.n[1];
        this.nor[o + 2] = f.n[2];
        this.col[o] = r;
        this.col[o + 1] = g;
        this.col[o + 2] = b;
        this.nightCol[o] = nr;
        this.nightCol[o + 1] = ng;
        this.nightCol[o + 2] = nb;
        this.verts++;
      }
      const i = this.indices;
      this.idx[i] = base;
      this.idx[i + 1] = base + 1;
      this.idx[i + 2] = base + 2;
      this.idx[i + 3] = base;
      this.idx[i + 4] = base + 2;
      this.idx[i + 5] = base + 3;
      this.indices += 6;
    }
  }

  /** The written boxes as a geometry; null when nothing was written. */
  geometry(): BufferGeometry | null {
    if (this.verts === 0) return null;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(this.pos.slice(0, this.verts * 3), 3));
    g.setAttribute("normal", new BufferAttribute(this.nor.slice(0, this.verts * 3), 3));
    const day = new BufferAttribute(this.col.slice(0, this.verts * 3), 3);
    g.setAttribute("color", day);
    g.userData = { day, night: new BufferAttribute(this.nightCol.slice(0, this.verts * 3), 3) };
    g.setIndex(new BufferAttribute(this.idx.slice(0, this.indices), 1));
    g.computeBoundingSphere();
    return g;
  }

  private nightOf(r: number, g: number, b: number): [number, number, number] {
    const l = this.lit;
    if (!l) return [r * 0.12, g * 0.13, b * 0.2];
    return [r * 0.42 + (l[0] / 255) * 0.4, g * 0.42 + (l[1] / 255) * 0.36, b * 0.42 + (l[2] / 255) * 0.3];
  }

  private reserve(verts: number, indices: number): void {
    if ((this.verts + verts) * 3 > this.pos.length) {
      const size = Math.max(this.pos.length * 2, (this.verts + verts) * 3);
      this.pos = grow(this.pos, size);
      this.nor = grow(this.nor, size);
      this.col = grow(this.col, size);
      this.nightCol = grow(this.nightCol, size);
    }
    if (this.indices + indices > this.idx.length) {
      const next = new Uint32Array(Math.max(this.idx.length * 2, this.indices + indices));
      next.set(this.idx);
      this.idx = next;
    }
  }
}

function grow(a: Float32Array, size: number): Float32Array {
  const next = new Float32Array(size);
  next.set(a);
  return next;
}
