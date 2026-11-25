/**
 * What moves in the Tower in 3D: elevator cars and people, each one
 * instanced mesh, so thousands of figures cost a couple of draw calls. The
 * crowd is sampled: at most the tier's cap, nearest the camera's target
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
import type { RenderPerson, RenderTransport } from "../render/renderModel";
import { DEPTH, SLAB, STORY } from "./bandGeometry";

const m4 = new Matrix4();
const tint = new Color();

const CAR_COLORS: Readonly<Record<string, number>> = {
  elevatorStandard: 0xc4baa0,
  elevatorService: 0xa8a090,
  elevatorExpress: 0xc8c8e2,
};

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

/** Elevator cars, placed every frame from the shafts' car positions. */
export class Cars {
  private readonly box = new BoxGeometry(1, 1, 1);
  private readonly mat = new MeshLambertMaterial({ color: 0xffffff });
  private readonly inst = new Instances(this.box, this.mat, 64);
  get mesh(): InstancedMesh {
    return this.inst.mesh;
  }

  /** Places every car; returns a replacement mesh when the old one was too small. */
  update(transports: readonly RenderTransport[]): InstancedMesh | null {
    let n = 0;
    for (const t of transports) if (CAR_COLORS[t.kind] !== undefined) n += t.carPositions.length;
    const swapped = this.inst.ensure(n);
    const mesh = this.inst.mesh;
    let i = 0;
    for (const t of transports) {
      const color = CAR_COLORS[t.kind];
      if (color === undefined) continue;
      for (const at of t.carPositions) {
        const h = STORY - SLAB - 0.15;
        m4.makeScale(t.width - 0.8, h, DEPTH * 0.6);
        m4.setPosition(t.x + t.width / 2, at * STORY + 0.05 + h / 2, -DEPTH * 0.5);
        mesh.setMatrixAt(i, m4);
        mesh.setColorAt(i, tint.setHex(color));
        i++;
      }
    }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return swapped;
  }

  dispose(): void {
    this.inst.mesh.dispose();
    this.box.dispose();
    this.mat.dispose();
  }
}

const CLOTHES = [0x3c5a96, 0xb44a3c, 0x4a8a5a, 0xd8b04a, 0x6a4a8a, 0x2c2c34, 0xe0e0dc, 0x8a6a4a];
const STAFF = 0x2a6ab0;
const HOLD_MS = 500;

/** People on foot, sampled to a cap and placed every frame. */
export class Crowd {
  private readonly body = new BoxGeometry(0.42, 0.95, 0.32);
  private readonly mat = new MeshLambertMaterial({ color: 0xffffff });
  private readonly inst = new Instances(this.body, this.mat, 256);
  private chosen: number[] = [];
  private chosenAt = -Infinity;
  get mesh(): InstancedMesh {
    return this.inst.mesh;
  }

  /**
   * Places up to `cap` people, nearest floor `focus` first. Riders are left
   * to their cars and finished walkers are gone.
   */
  update(people: readonly RenderPerson[], cap: number, focus: number, now: number): InstancedMesh | null {
    if (now - this.chosenAt > HOLD_MS || this.chosen.length > people.length) {
      this.chosen = sample(people, cap, focus);
      this.chosenAt = now;
    }
    const swapped = this.inst.ensure(this.chosen.length);
    const mesh = this.inst.mesh;
    let n = 0;
    for (const i of this.chosen) {
      const p = people[i];
      if (!p || p.state === "riding" || p.state === "done") continue;
      // Depth from the seed, so a person keeps their place in the room.
      const z = -DEPTH * (0.15 + ((p.seed >>> 3) % 64) / 100);
      m4.makeTranslation(p.x + 0.5, p.fy * STORY + 0.5, z);
      mesh.setMatrixAt(n, m4);
      mesh.setColorAt(n, tint.setHex(p.staff ? STAFF : (CLOTHES[p.seed % CLOTHES.length] ?? STAFF)));
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return swapped;
  }

  dispose(): void {
    this.inst.mesh.dispose();
    this.body.dispose();
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
