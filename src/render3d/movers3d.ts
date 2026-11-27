/**
 * The motion helpers of the Tower in 3D: the glide that smooths cars
 * (`cabs3d.ts`) and people (`people3d.ts`) between game steps, the crowd
 * sample (at most the tier's cap, nearest the camera's target first), and
 * the street traffic.
 */
import { BoxGeometry, Color, DynamicDrawUsage, InstancedMesh, Matrix4, MeshLambertMaterial } from "three";
import type { RenderPerson } from "../render/renderModel";

const m4 = new Matrix4();
const tint = new Color();

/** A resizable instanced mesh: grows to the count it is asked for. */
/** How fast a drawn figure or car catches up with the game, per second. */
const GLIDE_RATE = 10;

/**
 * Drawn positions that glide toward the game's, so motion stays smooth
 * between simulation steps instead of jumping a step at a time. A jump too
 * long to be a step (a new figure, a teleport) snaps.
 */
export class Glide {
  private readonly pos = new Map<number | string, { x: number; y: number; seen: number }>();
  private frame = 0;
  private last = 0;
  private alpha = 1;

  /** `snapX`, `snapY`: the longest move, in tiles and floors, that still glides. */
  constructor(
    private readonly snapX = 8,
    private readonly snapY = 3,
  ) {}

  /** Starts a frame at `now` (ms). */
  tick(now: number): void {
    const dt = this.last > 0 ? Math.min(0.25, Math.max(0, (now - this.last) / 1000)) : 1;
    this.last = now;
    this.alpha = 1 - Math.exp(-dt * GLIDE_RATE);
    this.frame++;
  }

  /** The drawn position of `key`, whose game position is `x, y`. */
  at(key: number | string, x: number, y: number): { readonly x: number; readonly y: number } {
    const d = this.pos.get(key);
    if (!d || Math.abs(d.x - x) > this.snapX || Math.abs(d.y - y) > this.snapY) {
      const fresh = { x, y, seen: this.frame };
      this.pos.set(key, fresh);
      return fresh;
    }
    d.x += (x - d.x) * this.alpha;
    d.y += (y - d.y) * this.alpha;
    d.seen = this.frame;
    return d;
  }

  /** Forgets keys not drawn this frame once more than `max` are held. */
  prune(max: number): void {
    if (this.pos.size <= max) return;
    for (const [k, d] of this.pos) if (d.seen !== this.frame) this.pos.delete(k);
  }
}

const STREET_PAINT = [0xc83c3c, 0x3c6ec8, 0xe6e6e6, 0xdcb43c, 0x2c2c34, 0x4a8a5a, 0xe07a2c];
const STREET_CARS = 14;
const STREET_SPEED = 0.012;

/** Cars driving the street behind the tower, both ways, as one instanced mesh. */
export class Traffic {
  private readonly box = new BoxGeometry(4.2, 1.3, 1.8);
  private readonly mat = new MeshLambertMaterial({ color: 0xffffff });
  readonly mesh: InstancedMesh;

  constructor() {
    this.mesh = new InstancedMesh(this.box, this.mat, STREET_CARS);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < STREET_CARS; i++) this.mesh.setColorAt(i, tint.setHex(STREET_PAINT[i % STREET_PAINT.length]!));
  }

  /** After dark the cars glow faintly, as if under the street lights. */
  setNight(on: boolean): void {
    this.mat.emissive.setHex(on ? 0x403830 : 0);
  }

  /** Moves every car along a street from `x0` to `x1` at height `ground`, `z` its middle. */
  update(now: number, x0: number, x1: number, ground: number, z: number): void {
    const span = x1 - x0;
    for (let i = 0; i < STREET_CARS; i++) {
      const east = i % 2 === 0;
      const speed = STREET_SPEED * (0.75 + ((i * 37) % 10) / 20);
      const t = (((now * speed + i * (span / STREET_CARS) * 1.7) % span) + span) % span;
      const x = east ? x0 + t : x1 - t;
      m4.makeTranslation(x, ground + 0.75, z + (east ? 1.6 : -1.6));
      this.mesh.setMatrixAt(i, m4);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.dispose();
    this.box.dispose();
    this.mat.dispose();
  }
}

/** The indices of up to `cap` people, nearest floor `focus` first. */
export function sample(people: readonly RenderPerson[], cap: number, focus: number): number[] {
  const idx: number[] = [];
  for (let i = 0; i < people.length; i++) {
    const s = people[i]!.state;
    if (s !== "riding" && s !== "done") idx.push(i);
  }
  if (idx.length <= cap) return idx;
  idx.sort((a, b) => Math.abs(people[a]!.fy - focus) - Math.abs(people[b]!.fy - focus));
  return idx.slice(0, cap);
}
