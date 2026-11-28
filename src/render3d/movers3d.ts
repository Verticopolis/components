/**
 * The motion helpers of the Tower in 3D: the step pace that glides cars
 * (`cabs3d.ts`) and people (`people3d.ts`) between game steps, the crowd
 * sample (at most the tier's cap, nearest the camera's target first), and
 * the street traffic.
 */
import { BoxGeometry, Color, DynamicDrawUsage, InstancedMesh, Matrix4, MeshLambertMaterial } from "three";
import { newStepClock, stepProgress, tickStepClock, type StepClock } from "../render/excalibur/crowdLook";
import type { RenderPerson } from "../render/renderModel";

const m4 = new Matrix4();
const tint = new Color();

/**
 * The side view's step clock (`crowdLook.ts`) run off this view's frames:
 * the game moves people and cars once per sim step, and the drawing glides
 * each from where it is drawn to its new position over one step's length,
 * at an even pace, the way the side view draws them. Cars (`cabs3d.ts`) and
 * people (`people3d.ts`) each keep one; they read the same game minute and
 * frame time, so they stay in step.
 */
export class StepPace {
  readonly clock: StepClock = newStepClock(0);
  private last = -1;

  /** Starts a frame at `now` (ms) with the game clock at `minutes`. */
  tick(minutes: number, now: number): void {
    if (this.last < 0) this.clock.minutes = minutes;
    const dt = this.last < 0 ? 0 : Math.min(MAX_FRAME_MS, Math.max(0, now - this.last));
    this.last = now;
    tickStepClock(this.clock, minutes, dt);
  }

  /** How far through the current step the drawing is, 0 to 1. */
  get progress(): number {
    return stepProgress(this.clock);
  }
}

/** The longest frame counted, so a stall (a hidden tab) never jumps the glide. */
const MAX_FRAME_MS = 250;

/** Drops the entries of `drawn` not used on frame `frame` once it holds more than `max`. */
export function pruneDrawn<T extends { seen: number }>(
  drawn: Map<number | string, T>,
  frame: number,
  max: number,
): void {
  if (drawn.size <= max) return;
  for (const [k, d] of drawn) if (d.seen !== frame) drawn.delete(k);
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
