/**
 * The game's own room art in the Tower in 3D, split for depth the way the
 * atlas's 2.5D layers are: per band of floors, one canvas of room walls
 * (windows, wall art, the floor band) hung on the back walls, and one canvas
 * of furniture and seated people stood out in front of them, both painted
 * with the side view's painters (`bandLayers.ts`). The rooms read the way they
 * do in the game, while the furniture's offset, the slabs, the shafts, the
 * cars and the people walking give the depth.
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
  Texture,
  Vector2,
  type WebGLRenderer,
} from "three";
import type { RenderTransport, RenderUnit } from "../render/renderModel";
import { drawTransport } from "../render/sprites";
import { FLOOR, TILE } from "../render/scale";
import { cutSlab, wellsAt } from "./wells";
import { shadeOf, VOXEL } from "./voxel3d";
import { BAND_FLOORS, DEPTH, SLAB, STORY } from "./bandGeometry";
import { paintSplit, type SplitTargets } from "./bandLayers";

/** How far in front of the back wall the art hangs, in tiles. */
const ART_Z = -DEPTH + 0.22;
/** How far the furniture stands out from the back wall, in tiles. */
const FRONT_OFFSET = 1.1;
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
  /** The rooms' walls. */
  readonly canvas = document.createElement("canvas");
  readonly texture: CanvasTexture;
  /** The rooms' furniture and seated people, on transparency. */
  readonly frontCanvas = document.createElement("canvas");
  readonly frontTexture: CanvasTexture;
  private readonly aside = document.createElement("canvas");
  /** Room-sized canvases a changed room repaints on: its shell, its furniture, and the shell held aside. */
  private readonly scratch = [0, 1, 2].map(() => document.createElement("canvas"));
  private readonly scratchTex = this.scratch.slice(0, 2).map((c) => new Texture(c));
  /** What each room looked like when it was last painted, and the light it was painted in. */
  private readonly painted = new Map<number, string>();
  private lit: boolean | null = null;
  geometry: BufferGeometry | null = null;
  frontGeometry: BufferGeometry | null = null;
  private frame: Frame | null = null;
  /** The elevator shafts crossing the band, painted over its rooms as the side view draws them. */
  private shafts: readonly RenderTransport[] = [];

  constructor(
    readonly band: number,
    private readonly detail: number,
  ) {
    this.texture = pixelTexture(this.canvas);
    this.frontTexture = pixelTexture(this.frontCanvas);
  }

  /** Lays the band's rooms out on the canvas and builds their quads. */
  layout(units: readonly RenderUnit[], stories: Stories, shafts: readonly RenderTransport[] = []): void {
    this.shafts = shafts.filter(
      (t) => isElevator(t) && t.bottom < (this.band + 1) * BAND_FLOORS && t.top >= this.band * BAND_FLOORS,
    );
    this.geometry?.dispose();
    this.frontGeometry?.dispose();
    this.geometry = null;
    this.frontGeometry = null;
    this.frame = frameFor(units, stories, this.band, this.detail, this.shafts);
    const f = this.frame;
    if (!f) return;
    const w = Math.max(1, Math.ceil(f.tiles * TILE * f.scale));
    const h = Math.max(1, Math.ceil(f.floors * FLOOR * f.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      for (const c of [this.canvas, this.frontCanvas, this.aside]) {
        c.width = w;
        c.height = h;
      }
      // A new size needs new GPU textures.
      this.texture.dispose();
      this.frontTexture.dispose();
    }
    this.geometry = quads(units, stories, f, this.band, "wall", this.shafts, shafts);
    this.frontGeometry = quads(units, stories, f, this.band, "front");
  }

  /** Paints the band's rooms as the side view draws them. */
  paint(units: readonly RenderUnit[], stories: Stories, look: ArtPaint): void {
    const f = this.frame;
    if (!f) return;
    const shell = this.canvas.getContext("2d");
    const front = this.frontCanvas.getContext("2d");
    const aside = this.aside.getContext("2d");
    if (!shell || !front || !aside) return;
    shell.setTransform(1, 0, 0, 1, 0, 0);
    shell.fillStyle = look.lit ? "#141a2c" : "#c8c4b8";
    shell.fillRect(0, 0, this.canvas.width, this.canvas.height);
    front.setTransform(1, 0, 0, 1, 0, 0);
    front.clearRect(0, 0, this.frontCanvas.width, this.frontCanvas.height);
    for (const ctx of [shell, front]) {
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(f.scale, 0, 0, f.scale, 0, 0);
    }
    const t: SplitTargets = { shell, front, aside, scale: f.scale };
    const d = { lit: look.lit, anim: look.anim, hour: look.hour, staffed: true };
    // Bare floors first: a room built on them paints over.
    for (const u of [...units].sort((a, b) => Number(b.kind === "floor") - Number(a.kind === "floor"))) {
      if (!inBand(u, this.band)) continue;
      const r = pixelRect(u, stories(u), f);
      paintSplit(t, d, u, r.x, r.y, r.w, r.h);
    }
    this.paintShafts(shell, front, f, -Infinity, Infinity);
    for (const u of units) if (inBand(u, this.band)) this.painted.set(u.id, signature(u));
    this.lit = look.lit;
    this.texture.needsUpdate = true;
    this.frontTexture.needsUpdate = true;
  }

  /** The shafts over the rooms between world pixels `x0` and `x1`, as the side view stacks them; nothing of a room stands in front of one. */
  private paintShafts(
    shell: CanvasRenderingContext2D,
    front: CanvasRenderingContext2D,
    f: Frame,
    x0: number,
    x1: number,
  ): void {
    for (const s of this.shafts) {
      const x = (s.x - f.x0) * TILE;
      const w = s.width * TILE;
      if (x >= x1 || x + w <= x0) continue;
      shell.save();
      shell.beginPath();
      shell.rect(x, 0, w, f.floors * FLOOR);
      shell.clip();
      try {
        drawTransport(shell, s, x, (f.top - (s.top + 1)) * FLOOR, w, FLOOR);
      } catch {
        // A shaft its painter can't draw leaves the rooms behind it showing.
      }
      shell.restore();
      front.clearRect(x, 0, w, f.floors * FLOOR);
    }
  }

  /**
   * Repaints up to `max` rooms whose state changed since they were painted,
   * each on room-sized scratch canvases, and uploads just those pixels into
   * the band's textures, so a busy tower never re-uploads a whole band. A
   * change of light repaints the band. Returns how many rooms it repainted.
   */
  refresh(
    units: readonly RenderUnit[],
    stories: Stories,
    look: ArtPaint,
    renderer: WebGLRenderer,
    max: number,
  ): number {
    const f = this.frame;
    if (!f) return 0;
    if (look.lit !== this.lit) {
      this.paint(units, stories, look);
      return max;
    }
    let n = 0;
    for (const u of units) {
      if (n >= max) break;
      if (u.kind === "floor" || !inBand(u, this.band)) continue;
      const sig = signature(u);
      if (this.painted.get(u.id) === sig) continue;
      this.painted.set(u.id, sig);
      this.repaintRoom(u, stories, look, renderer, f);
      n++;
    }
    return n;
  }

  private repaintRoom(u: RenderUnit, stories: Stories, look: ArtPaint, renderer: WebGLRenderer, f: Frame): void {
    const r = pixelRect(u, stories(u), f);
    const s = f.scale;
    const ox = Math.floor(r.x * s);
    const oy = Math.floor(r.y * s);
    const w = Math.min(this.canvas.width, Math.ceil((r.x + r.w) * s)) - ox;
    const h = Math.min(this.canvas.height, Math.ceil((r.y + r.h) * s)) - oy;
    if (w <= 0 || h <= 0 || ox < 0 || oy < 0) return;
    const [shellC, frontC, asideC] = this.scratch;
    for (const c of this.scratch) {
      c.width = w;
      c.height = h;
    }
    const shell = shellC.getContext("2d");
    const front = frontC.getContext("2d");
    const aside = asideC.getContext("2d");
    if (!shell || !front || !aside) return;
    shell.fillStyle = look.lit ? "#141a2c" : "#c8c4b8";
    shell.fillRect(0, 0, w, h);
    for (const ctx of [shell, front]) {
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(s, 0, 0, s, -ox, -oy);
    }
    const d = { lit: look.lit, anim: look.anim, hour: look.hour, staffed: true };
    paintSplit({ shell, front, aside, scale: s, ox, oy }, d, u, r.x, r.y, r.w, r.h);
    this.paintShafts(shell, front, f, r.x, r.x + r.w);
    // Keep the band's own canvases true, then send only the room's pixels to the GPU.
    const band = [this.canvas.getContext("2d"), this.frontCanvas.getContext("2d")];
    [shellC, frontC].forEach((c, i) => {
      const ctx = band[i];
      if (!ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(ox, oy, w, h);
      ctx.drawImage(c, ox, oy);
      ctx.restore();
    });
    // Texture rows run bottom up (flipY), so the room lands `oy + h` rows from the top.
    const at = new Vector2(ox, this.canvas.height - oy - h);
    renderer.copyTextureToTexture(this.scratchTex[0], this.texture, null, at);
    renderer.copyTextureToTexture(this.scratchTex[1], this.frontTexture, null, at);
  }

  dispose(): void {
    this.geometry?.dispose();
    this.frontGeometry?.dispose();
    this.texture.dispose();
    this.frontTexture.dispose();
    for (const c of [this.canvas, this.frontCanvas, this.aside]) {
      c.width = 0;
      c.height = 0;
    }
  }
}

/** What a room's art depends on besides its kind and place, which a change of either rebuilds. */
function signature(u: RenderUnit): string {
  return `${u.state}|${u.subtype ?? ""}|${u.occupants}|${u.outForMeal ?? 0}|${u.customersIn ?? 0}`;
}

/** A canvas texture that keeps the art's pixels crisp up close. */
function pixelTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.magFilter = NearestFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.anisotropy = 4;
  return t;
}

/** Paints `band`'s rooms and builds the mesh that hangs them, or null for a band with no rooms. */
export function hangArt(
  band: number,
  units: readonly RenderUnit[],
  stories: Stories,
  look: ArtPaint,
  tint: number,
  shafts: readonly RenderTransport[] = [],
  voxel = false,
): { readonly paint: BandArt; readonly meshes: readonly Mesh[] } | null {
  const paint = new BandArt(band, 1);
  paint.layout(units, stories, shafts);
  if (!paint.geometry) {
    paint.dispose();
    return null;
  }
  paint.paint(units, stories, look);
  const meshes: Mesh[] = [new Mesh(paint.geometry, new MeshBasicMaterial({ map: paint.texture, color: tint }))];
  // The voxel look stacks the furniture layer a few art pixels deep toward the wall (voxel3d.ts).
  let slices = voxel ? FURNITURE_SLICES : 1;
  if (!paint.frontGeometry) slices = 0;
  for (let i = 0; i < slices; i++) {
    const m = new Mesh(
      paint.frontGeometry!,
      new MeshBasicMaterial({ map: paint.frontTexture, transparent: !voxel, alphaTest: voxel ? 0.5 : 0.04 }),
    );
    m.userData.shade = shadeOf(i, slices);
    m.position.z = -i * VOXEL;
    meshes.push(tintArt(m, tint));
  }
  return { paint, meshes };
}

/** How many art pixels deep the voxel look stacks the furniture layer. */
const FURNITURE_SLICES = 6;

/** Gives an art mesh the time of day's tint, darkened for a voxel stack's inner copies. */
export function tintArt(m: Mesh, tint: number): Mesh {
  (m.material as MeshBasicMaterial).color.setHex(tint).multiplyScalar((m.userData.shade as number | undefined) ?? 1);
  return m;
}

function inBand(u: RenderUnit, band: number): boolean {
  return Math.floor(u.floor / BAND_FLOORS) === band;
}

function isElevator(t: RenderTransport): boolean {
  return t.kind === "elevatorStandard" || t.kind === "elevatorService" || t.kind === "elevatorExpress";
}

/** The band's floors a shaft crosses. */
function shaftFloors(t: RenderTransport, band: number): { readonly f0: number; readonly f1: number } {
  return { f0: Math.max(t.bottom, band * BAND_FLOORS), f1: Math.min(t.top, (band + 1) * BAND_FLOORS - 1) };
}

/** The canvas frame for a band's rooms and shafts, or null when it has none. */
function frameFor(
  units: readonly RenderUnit[],
  stories: Stories,
  band: number,
  detail: number,
  shafts: readonly RenderTransport[],
): Frame | null {
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
  for (const t of shafts) {
    x0 = Math.min(x0, t.x);
    x1 = Math.max(x1, t.x + t.width);
    top = Math.max(top, shaftFloors(t, band).f1 + 1);
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
 * The wall layer has two quads per room: its art on the back wall, and its
 * bottom few rows of art stretched over the room's floor toward the open
 * front, so the floor wears the room's own carpet or tiles. The front layer
 * has one per room, standing in front of the wall and dropped by the floor
 * band so the furniture's feet meet the 3D floor. UVs are on the band's
 * canvases, which share one layout.
 */
function quads(
  units: readonly RenderUnit[],
  stories: Stories,
  f: Frame,
  band: number,
  layer: "wall" | "front",
  shafts: readonly RenderTransport[] = [],
  climbs: readonly RenderTransport[] = [],
): BufferGeometry | null {
  const list = units.filter((u) => inBand(u, band));
  let shaftQuads = 0;
  for (const t of shafts) {
    const { f0, f1 } = shaftFloors(t, band);
    shaftQuads += Math.max(0, f1 - f0 + 1);
  }
  if (!list.length && !shaftQuads) return null;
  // The carpet opens where a shaft or a flight climbs through the floor (wells.ts).
  const carpets =
    layer === "wall" ? list.map((u) => cutSlab(u.x, u.x + u.width, ART_Z, 0, wellsAt(climbs, u.floor, DEPTH))) : [];
  const n = list.length + carpets.reduce((sum, c) => sum + c.length, 0) + shaftQuads;
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
  list.forEach((u, i) => {
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
    if (layer === "front") {
      const z = ART_Z + FRONT_OFFSET;
      const drop = (CARPET_PX * STORY) / FLOOR;
      quad(
        [x0, y0 - drop, z, x1, y0 - drop, z, x1, y1 - drop, z, x0, y1 - drop, z],
        [u0, v0, u1, v0, u1, v1, u0, v1],
        [0, 0, 1],
      );
      return;
    }
    // A bare floor hangs a hair behind, so a room on the same tiles wins.
    const z = u.kind === "floor" ? ART_Z - 0.04 : ART_Z;
    quad([x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z], [u0, v0, u1, v0, u1, v1, u0, v1], [0, 0, 1]);
    const fy = y0 + (u.kind === "floor" ? 0.03 : 0.05);
    const vc = v0 + CARPET_PX / ch;
    const ux = (x: number): number => u0 + ((x - x0) / (x1 - x0)) * (u1 - u0);
    const vz = (d: number): number => v0 + (vc - v0) * (d / ART_Z);
    for (const p of carpets[i]!) {
      const [ua, ub, vf, vb] = [ux(p.x0), ux(p.x1), vz(p.z1), vz(p.z0)];
      quad(
        [p.x0, fy, p.z1, p.x1, fy, p.z1, p.x1, fy, p.z0, p.x0, fy, p.z0],
        [ua, vf, ub, vf, ub, vb, ua, vb],
        [0, 1, 0],
      );
    }
  });
  // A shaft's art one story at a time, so it lines up with the rooms beside it; a hair in front of them.
  for (const t of shafts) {
    const { f0, f1 } = shaftFloors(t, band);
    const u0 = ((t.x - f.x0) * TILE) / cw;
    const u1 = ((t.x + t.width - f.x0) * TILE) / cw;
    const z = ART_Z + 0.02;
    for (let fl = f0; fl <= f1; fl++) {
      const v0 = 1 - ((f.top - fl) * FLOOR) / ch;
      const v1 = 1 - ((f.top - fl - 1) * FLOOR) / ch;
      const y0 = fl * STORY;
      const y1 = (fl + 1) * STORY - SLAB;
      quad(
        [t.x, y0, z, t.x + t.width, y0, z, t.x + t.width, y1, z, t.x, y1, z],
        [u0, v0, u1, v0, u1, v1, u0, v1],
        [0, 0, 1],
      );
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("normal", new BufferAttribute(nor, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(new BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}
