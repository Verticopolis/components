/**
 * What moves in the Tower in 3D besides the cars (`cabs3d.ts`): people and
 * street traffic, each instanced, so thousands of figures cost a couple of
 * draw calls. The crowd is sampled: at most the tier's cap, nearest the camera's target
 * first, with the choice held for half a second so figures don't flicker.
 */
import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  type Material,
} from "three";
import type { RenderPerson } from "../render/renderModel";
import { DEPTH, STORY } from "./bandGeometry";

const m4 = new Matrix4();
const tint = new Color();

/** A resizable instanced mesh: grows to the count it is asked for. */
class Instances {
  mesh: InstancedMesh;
  constructor(
    private readonly geometry: BoxGeometry,
    private readonly material: Material,
    capacity: number,
  ) {
    this.mesh = this.make(capacity);
  }
  private make(capacity: number): InstancedMesh {
    const m = new InstancedMesh(this.geometry, this.material, capacity);
    m.instanceMatrix.setUsage(DynamicDrawUsage);
    m.frustumCulled = false;
    m.count = 0;
    return m;
  }
  /** Makes room for `n`; returns the new mesh when it had to be replaced. */
  ensure(n: number): InstancedMesh | null {
    if (n <= this.mesh.instanceMatrix.count) return null;
    const old = this.mesh;
    this.mesh = this.make(Math.max(n, old.instanceMatrix.count * 2));
    old.dispose();
    return this.mesh;
  }
}

const CLOTHES = [0x3c5a96, 0xb44a3c, 0x4a8a5a, 0xd8b04a, 0x6a4a8a, 0x2c2c34, 0xe0e0dc, 0x8a6a4a];
const SKIN = [0xf1c8a0, 0xd9a070, 0xa8704a, 0x7a4a2c, 0xe8b890];
const HAIR = [0x2a1a10, 0x4a2c18, 0x8a5a2c, 0xd8b060, 0x1a1a1a];
const STAFF = 0x2a6ab0;
const HOLD_MS = 500;
const BODY_H = 1.25;
const HEAD = 0.46;

/** People on foot, sampled to a cap and placed every frame: a body and a head each. */
export class Crowd {
  private readonly body = new BoxGeometry(0.55, BODY_H, 0.4);
  private readonly head = new BoxGeometry(HEAD, HEAD, HEAD);
  private readonly mat = new MeshLambertMaterial({ color: 0xffffff });
  private readonly bodies = new Instances(this.body, this.mat, 256);
  private readonly heads = new Instances(this.head, this.mat, 256);
  private chosen: number[] = [];
  private chosenAt = -Infinity;
  /** Where each figure is drawn, gliding to the game's position between its steps. */
  private readonly drawn = new Glide();
  get mesh(): InstancedMesh {
    return this.bodies.mesh;
  }
  get headMesh(): InstancedMesh {
    return this.heads.mesh;
  }

  /** After dark the figures glow faintly, so they read against lit rooms. */
  setNight(on: boolean): void {
    this.mat.emissive.setHex(on ? 0x5a5048 : 0);
  }

  /**
   * Places up to `cap` people, nearest floor `focus` first. Riders are left
   * to their cars and finished walkers are gone. Returns any mesh that had
   * to be replaced, for the caller to add to the scene.
   */
  update(people: readonly RenderPerson[], cap: number, focus: number, now: number): InstancedMesh[] {
    if (now - this.chosenAt > HOLD_MS || this.chosen.length > people.length) {
      this.chosen = sample(people, cap, focus);
      this.chosenAt = now;
    }
    const swapped = [this.bodies.ensure(this.chosen.length), this.heads.ensure(this.chosen.length)].filter(
      (m): m is InstancedMesh => m !== null,
    );
    const body = this.bodies.mesh;
    const head = this.heads.mesh;
    this.drawn.tick(now);
    let n = 0;
    for (const i of this.chosen) {
      const p = people[i];
      if (!p || p.state === "riding" || p.state === "done") continue;
      // Depth from the seed, so a person keeps their place in the room.
      const z = -DEPTH * (0.12 + ((p.seed >>> 3) % 48) / 100);
      const walking = p.state === "toShaft" || p.state === "toDest" || p.state === "climbing";
      const bob = walking ? Math.abs(Math.sin(now / 140 + (p.seed % 17))) * 0.12 : 0;
      const at = this.drawn.at(p.id, p.x, p.fy);
      const x = at.x;
      const base = at.y * STORY + bob;
      m4.makeTranslation(x + 0.5, base + BODY_H / 2, z);
      body.setMatrixAt(n, m4);
      body.setColorAt(n, tint.setHex(p.staff ? STAFF : (CLOTHES[p.seed % CLOTHES.length] ?? STAFF)));
      m4.makeTranslation(x + 0.5, base + BODY_H + HEAD / 2 + 0.02, z);
      head.setMatrixAt(n, m4);
      const hair = (p.seed >>> 5) % 3 === 0;
      head.setColorAt(
        n,
        tint.setHex(hair ? (HAIR[(p.seed >>> 7) % HAIR.length] ?? 0) : (SKIN[(p.seed >>> 9) % SKIN.length] ?? 0)),
      );
      n++;
    }
    this.drawn.prune(this.chosen.length * 2);
    for (const m of [body, head]) {
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    return swapped;
  }

  dispose(): void {
    this.bodies.mesh.dispose();
    this.heads.mesh.dispose();
    this.body.dispose();
    this.head.dispose();
    this.mat.dispose();
  }
}

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
