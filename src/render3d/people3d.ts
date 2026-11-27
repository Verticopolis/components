/**
 * The walking people of the Tower in 3D, drawn with the game's own figures
 * (`drawPerson`, the side view's cast and housekeeping crew): each person is
 * a flat cutout that turns to face the camera, one instanced quad over a
 * small atlas of every look, walk frame and facing, picked per person by an
 * instanced cell offset. The whole crowd stays one draw call.
 */
import {
  CanvasTexture,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
} from "three";
import type { RenderPerson } from "../render/renderModel";
import { castIndex, crewIndex, drawPerson, LOOKS, type Pose } from "../render/pixelSprites/people";
import { FLOOR, TILE } from "../render/scale";
import { DEPTH, STORY } from "./bandGeometry";
import type { Orbit } from "./camera3d";
import { Glide, sample } from "./movers3d";

/** One figure's cell, in side-view pixels (the side view's own figure bake). */
const CELL_W = 30;
const CELL_H = 31;
const FOOT = 29;
const BODY_X = 11;
/** Atlas pixels per art pixel. */
const PX = 2;
/** Per facing: standing, then the four walk frames. */
const FRAMES = 5;
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
  const frame = walking ? 1 + (Math.floor(now / STRIDE_MS + Math.abs(p.seed)) % 4) : 0;
  const col = (left ? FRAMES : 0) + frame;
  return [col / COLS, 1 - (Math.min(row, ROWS - 1) + 1) / ROWS];
}

/** The people walking the floors, placed every frame from the crowd the game sends. */
export class Crowd {
  private readonly plane = new PlaneGeometry(1, 1);
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

  constructor() {
    this.texture = new CanvasTexture(paintAtlas());
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
    this.texture.generateMipmaps = false;
    this.mat = new MeshBasicMaterial({ map: this.texture, alphaTest: 0.5, side: DoubleSide });
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
    this.plane.setAttribute("figAt", cells);
    const m = new InstancedMesh(this.plane, this.mat, capacity);
    m.instanceMatrix.setUsage(DynamicDrawUsage);
    m.frustumCulled = false;
    m.count = 0;
    return [m, cells];
  }

  /** After dark the figures dim a little, as the room art does. */
  setNight(on: boolean): void {
    this.mat.color = new Color(on ? 0xb8b4c8 : 0xffffff);
  }

  /**
   * Places up to `cap` people, nearest the orbit's target floor first, each
   * turned to face the camera. Riders are left to their cars and finished
   * walkers are gone. Returns the new mesh when the old one was too small.
   */
  update(people: readonly RenderPerson[], cap: number, orbit: Orbit, now: number): InstancedMesh[] {
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
    turn.makeRotationY(orbit.theta);
    let n = 0;
    for (const i of this.chosen) {
      const p = people[i];
      if (!p || p.state === "riding" || p.state === "done") continue;
      // Depth from the seed, so a person keeps their place in the room.
      const z = -DEPTH * (0.12 + ((p.seed >>> 3) % 48) / 100);
      const at = this.drawn.at(p.id, p.x, p.fy);
      const dx = p.x - at.x;
      const walking = (p.state === "toShaft" || p.state === "toDest") && Math.abs(dx) > 0.01;
      if (walking) this.facing.set(p.id, dx < 0);
      const left = this.facing.get(p.id) ?? p.seed % 2 === 0;
      m4.makeScale(WIDTH, HEIGHT, 1).premultiply(turn);
      m4.setPosition(at.x + 0.5, at.y * STORY + LIFT, z);
      this.figures.setMatrixAt(n, m4);
      const [u, v] = figureCell(p, walking, left, now);
      this.cells.setXY(n, u, v);
      n++;
    }
    this.drawn.prune(this.chosen.length * 2);
    if (this.facing.size > this.chosen.length * 4) this.facing.clear();
    this.figures.count = n;
    this.figures.instanceMatrix.needsUpdate = true;
    this.cells.needsUpdate = true;
    return swapped;
  }

  dispose(): void {
    this.figures.dispose();
    this.plane.dispose();
    this.mat.dispose();
    this.texture.dispose();
  }
}
