/**
 * The walking people of the Tower in 3D, drawn with the game's own figures
 * (`drawPerson`, the side view's cast and housekeeping crew): each person is
 * a flat cutout that turns to face the camera, one instanced quad over a
 * small atlas of every look, walk frame and facing, picked per person by an
 * instanced cell offset. The whole crowd stays one draw call.
 */
import {
  type BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  NearestFilter,
  SRGBColorSpace,
  Vector2,
} from "three";
import { climbDrawX, leaveFlight, type Climber } from "../render/climbPath";
import type { RenderPerson, RenderTransport } from "../render/renderModel";
import { castIndex, crewIndex, drawPerson, LOOKS, type Pose } from "../render/pixelSprites/people";
import { FLOOR, TILE } from "../render/scale";
import { DEPTH, STORY } from "./bandGeometry";
import type { Orbit } from "./camera3d";
import { FLIGHT_FAR, FLIGHT_NEAR } from "./flights3d";
import { Glide, sample } from "./movers3d";
import { slabStack } from "./voxel3d";

/** One figure's cell, in side-view pixels (the side view's own figure bake). */
const CELL_W = 30;
const CELL_H = 31;
const FOOT = 29;
const BODY_X = 11;
/** Atlas pixels per art pixel. */
const PX = 2;
/** Per facing: standing, the four walk frames, then the four climb frames. */
const FRAMES = 9;
const COLS = FRAMES * 2;
const ROWS = LOOKS.length;
/** World units per side-view pixel, the same scale the room art hangs at. */
const UNIT_X = 1 / TILE;
const UNIT_Y = STORY / FLOOR;
const WIDTH = CELL_W * UNIT_X;
const HEIGHT = CELL_H * UNIT_Y;
/** How far the quad's middle sits above the foot line. */
const LIFT = HEIGHT / 2 - (CELL_H - FOOT - 1) * UNIT_Y;
const HOLD_MS = 500;
/** How many art pixels deep a figure is in the voxel look. */
const FIGURE_SLICES = 5;
/** A climber's depth: the middle of the flight's steps. */
const CLIMB_Z = (-DEPTH * (FLIGHT_NEAR + FLIGHT_FAR)) / 2;
const STRIDE_MS = 140;

const m4 = new Matrix4();
const turn = new Matrix4();

/** Paints every figure the crowd can show. */
function paintAtlas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL_W * PX;
  canvas.height = ROWS * CELL_H * PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  LOOKS.forEach((look, row) => {
    // The crew pushes its cart or vacuum; everyone else walks.
    const moving: Pose = look.carry === "cart" || look.carry === "vacuum" ? "push" : "walk";
    for (let c = 0; c < COLS; c++) {
      const left = c >= FRAMES;
      const f = c % FRAMES;
      ctx.setTransform(left ? -PX : PX, 0, 0, PX, (left ? c + 1 : c) * CELL_W * PX, row * CELL_H * PX);
      try {
        drawPerson(ctx, BODY_X, FOOT, look, {
          lit: false,
          pose: f === 0 ? "stand" : moving,
          frame: f === 0 ? 1 : f - 1,
        });
      } catch {
        // A figure its painter can't draw stays empty.
      }
    }
  });
  return canvas;
}

/** The atlas cell a person shows, as its texture offset (texture v runs up). */
export function figureCell(p: RenderPerson, walking: boolean, left: boolean, now: number): [number, number] {
  const row = p.staff ? crewIndex(p.seed, false) : castIndex(p.seed);
  const step = Math.floor(now / STRIDE_MS + Math.abs(p.seed)) % 4;
  let frame = 0;
  if (p.state === "climbing") frame = 5 + step;
  else if (walking) frame = 1 + step;
  const col = (left ? FRAMES : 0) + frame;
  return [col / COLS, 1 - (Math.min(row, ROWS - 1) + 1) / ROWS];
}

/** What the crowd reads from the game each frame. */
export interface CrowdSource {
  readonly crowd: { readonly people: readonly RenderPerson[] };
  readonly tower: { readonly transports: readonly RenderTransport[] };
}

/** The people walking the floors, placed every frame from the crowd the game sends. */
export class Crowd {
  private readonly flat = slabStack(1);
  /** The voxel look's figure: the cutout stacked a few art pixels deep (voxel3d.ts). */
  private readonly deep = slabStack(FIGURE_SLICES);
  private geo: BufferGeometry = this.flat;
  /** Whether figures turn to face the camera; the voxel look's stand square to the front. */
  private turns = true;
  private readonly texture: CanvasTexture;
  private readonly mat: MeshBasicMaterial;
  private cells: InstancedBufferAttribute;
  private figures: InstancedMesh;
  private chosen: number[] = [];
  private chosenAt = -Infinity;
  /** Where each figure is drawn, gliding to the game's position between its steps. */
  private readonly drawn = new Glide();
  /** The way each figure last walked, so one who stops keeps facing it. */
  private readonly facing = new Map<number, boolean>();
  /** Each climber's flight and place on its run, as the side view keeps them (`climbPath.ts`). */
  private readonly climbers = new Map<number, Climber & { down?: boolean }>();

  constructor() {
    this.texture = new CanvasTexture(paintAtlas());
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
    this.texture.generateMipmaps = false;
    this.mat = new MeshBasicMaterial({ map: this.texture, alphaTest: 0.5, side: DoubleSide, vertexColors: true });
    const cell = new Vector2(1 / COLS, 1 / ROWS);
    this.mat.onBeforeCompile = (shader) => {
      shader.uniforms.figCell = { value: cell };
      shader.vertexShader =
        "attribute vec2 figAt;\nuniform vec2 figCell;\n" +
        shader.vertexShader.replace(
          "#include <uv_vertex>",
          "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * figCell + figAt;\n#endif",
        );
    };
    [this.figures, this.cells] = this.make(256);
  }

  get mesh(): InstancedMesh {
    return this.figures;
  }

  private make(capacity: number): [InstancedMesh, InstancedBufferAttribute] {
    const cells = new InstancedBufferAttribute(new Float32Array(capacity * 2), 2);
    cells.setUsage(DynamicDrawUsage);
    this.geo.setAttribute("figAt", cells);
    const m = new InstancedMesh(this.geo, this.mat, capacity);
    m.instanceMatrix.setUsage(DynamicDrawUsage);
    m.frustumCulled = false;
    m.count = 0;
    return [m, cells];
  }

  /** Gives the figures the voxel look's depth, or back to flat cutouts. */
  setVoxel(on: boolean): void {
    this.turns = !on;
    this.geo = on ? this.deep : this.flat;
    this.geo.setAttribute("figAt", this.cells);
    this.figures.geometry = this.geo;
  }

  /** After dark the figures dim a little, as the room art does. */
  setNight(on: boolean): void {
    this.mat.color = new Color(on ? 0xb8b4c8 : 0xffffff);
  }

  /**
   * Places up to `cap` of the crowd's people, nearest the orbit's target
   * floor first, each turned to face the camera; a climber goes up a
   * flight's steps the way the side view draws it. Riders are left to their cars and finished
   * walkers are gone. Returns the new mesh when the old one was too small.
   */
  update(sim: CrowdSource, cap: number, orbit: Orbit, now: number): InstancedMesh[] {
    const people = sim.crowd.people;
    const transports = sim.tower.transports;
    const focus = orbit.ty / STORY;
    if (now - this.chosenAt > HOLD_MS || this.chosen.length > people.length) {
      this.chosen = sample(people, cap, focus);
      this.chosenAt = now;
    }
    const swapped: InstancedMesh[] = [];
    if (this.chosen.length > this.figures.instanceMatrix.count) {
      this.figures.removeFromParent();
      this.figures.dispose();
      [this.figures, this.cells] = this.make(Math.max(this.chosen.length, this.figures.instanceMatrix.count * 2));
      swapped.push(this.figures);
    }
    this.drawn.tick(now);
    turn.makeRotationY(this.turns ? orbit.theta : 0);
    let n = 0;
    for (const i of this.chosen) {
      const p = people[i];
      if (!p || p.state === "riding" || p.state === "done") continue;
      // Depth from the seed, so a person keeps their place in the room; a
      // climber keeps to the flight, on the wall in the art look.
      const climbing = p.state === "climbing";
      const z = climbing ? CLIMB_Z : -DEPTH * (0.1 + ((p.seed >>> 3) % 29) / 100);
      const at = this.drawn.at(p.id, p.x, p.fy);
      let x = at.x;
      const dx = p.x - at.x;
      const walking = (p.state === "toShaft" || p.state === "toDest") && Math.abs(dx) > 0.01;
      if (walking) this.facing.set(p.id, dx < 0);
      if (climbing) {
        let c = this.climbers.get(p.id);
        if (!c) this.climbers.set(p.id, (c = {}));
        if (Math.abs(p.fy - at.y) > 1e-3) c.down = p.fy < at.y;
        const cx = climbDrawX(c, transports, p.x, p.floor, at.y, c.down === true);
        if (cx !== undefined) {
          x = cx - 0.5;
          this.facing.set(p.id, c.climbLeft === true);
        }
      } else {
        const c = this.climbers.get(p.id);
        if (c) {
          leaveFlight(c);
          this.climbers.delete(p.id);
        }
      }
      const left = this.facing.get(p.id) ?? p.seed % 2 === 0;
      m4.makeScale(WIDTH, HEIGHT, 1).premultiply(turn);
      m4.setPosition(x + 0.5, at.y * STORY + LIFT, z);
      this.figures.setMatrixAt(n, m4);
      const [u, v] = figureCell(p, walking, left, now);
      this.cells.setXY(n, u, v);
      n++;
    }
    this.drawn.prune(this.chosen.length * 2);
    if (this.facing.size > this.chosen.length * 4) this.facing.clear();
    if (this.climbers.size > this.chosen.length * 4) this.climbers.clear();
    this.figures.count = n;
    this.figures.instanceMatrix.needsUpdate = true;
    this.cells.needsUpdate = true;
    return swapped;
  }

  dispose(): void {
    this.figures.dispose();
    this.flat.dispose();
    this.deep.dispose();
    this.mat.dispose();
    this.texture.dispose();
  }
}
