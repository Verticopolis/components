/**
 * The elevator cars of the Tower in 3D: each a box for the cab's sides and
 * roof, with the game's own cab art on its open face (`drawCar`: the walnut
 * cab, its riders, the door frames and the direction lantern). The faces are
 * one instanced quad over a small atlas of every kind, rider count and
 * lantern, picked per car by an instanced cell offset, so every car still
 * costs nothing past two draw calls.
 */
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
} from "three";
import type { CarArrow } from "../render/carIndicator";
import type { FacilityKind, RenderTransport } from "../render/renderModel";
import { FLOOR, TILE } from "../render/scale";
import { drawCar } from "../render/sprites";
import { DEPTH, SLAB, STORY } from "./bandGeometry";
import { Glide } from "./movers3d";

const KINDS: readonly FacilityKind[] = ["elevatorStandard", "elevatorService", "elevatorExpress"];
/** The cab frame's color on the box's sides, per kind (`drawCarBack`). */
const FRAME: Readonly<Record<string, number>> = {
  elevatorStandard: 0x4a4238,
  elevatorService: 0x54584c,
  elevatorExpress: 0x3a4048,
};
/** Rider counts the atlas holds: 0 to this many less one. A fuller car shows the most. */
const RIDERS = 7;
const ARROWS: readonly CarArrow[] = [null, "up", "down"];
const CELL_W = 4 * TILE;
const CELL_H = FLOOR;
/** Atlas pixels per art pixel, so the faces stay crisp up close. */
const PX = 2;
const COLS = RIDERS * ARROWS.length;
const ROWS = KINDS.length;

const m4 = new Matrix4();
const tint = new Color();

/** Paints every cab face the cars can show. */
function paintAtlas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL_W * PX;
  canvas.height = ROWS * CELL_H * PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  KINDS.forEach((kind, row) => {
    for (let r = 0; r < RIDERS; r++)
      ARROWS.forEach((arrow, a) => {
        const col = r * ARROWS.length + a;
        ctx.setTransform(PX, 0, 0, PX, col * CELL_W * PX, row * CELL_H * PX);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, CELL_W, CELL_H);
        ctx.clip();
        try {
          drawCar(ctx, row * 31 + r * 7, CELL_W, CELL_H, r, arrow, false, kind);
        } catch {
          // A cab its painter can't draw keeps its frame color.
        }
        ctx.restore();
      });
  });
  return canvas;
}

function arrowOf(dir: number): CarArrow {
  if (dir > 0) return "up";
  if (dir < 0) return "down";
  return null;
}

/** The atlas cell a car shows, as its texture offset (texture v runs up). */
export function cabCell(kind: FacilityKind, load: number, dir: number): [number, number] {
  const row = Math.max(0, KINDS.indexOf(kind));
  const r = Math.max(0, Math.min(RIDERS - 1, Math.floor(load)));
  const a = ARROWS.indexOf(arrowOf(dir));
  return [(r * ARROWS.length + a) / COLS, 1 - (row + 1) / ROWS];
}

/** Elevator cars, placed every frame from the shafts' car positions. */
export class Cars {
  private readonly box = new BoxGeometry(1, 1, 1);
  private readonly frameMat = new MeshLambertMaterial({ color: 0xffffff });
  private readonly texture: CanvasTexture;
  private readonly faceMat: MeshBasicMaterial;
  private boxes: InstancedMesh;
  private faces: InstancedMesh;
  private cells: InstancedBufferAttribute;
  /** Where each car is drawn, gliding between the game's steps. */
  private readonly drawn = new Glide(1, 60);

  constructor() {
    this.texture = new CanvasTexture(paintAtlas());
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
    this.texture.generateMipmaps = false;
    this.faceMat = new MeshBasicMaterial({ map: this.texture });
    const cell = new Vector2(1 / COLS, 1 / ROWS);
    this.faceMat.onBeforeCompile = (shader) => {
      shader.uniforms.cabCell = { value: cell };
      shader.vertexShader =
        "attribute vec2 cabAt;\nuniform vec2 cabCell;\n" +
        shader.vertexShader.replace(
          "#include <uv_vertex>",
          "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * cabCell + cabAt;\n#endif",
        );
    };
    [this.boxes, this.faces, this.cells] = this.make(64);
  }

  /** The two meshes to add to the scene. */
  get meshes(): readonly InstancedMesh[] {
    return [this.boxes, this.faces];
  }

  private make(capacity: number): [InstancedMesh, InstancedMesh, InstancedBufferAttribute] {
    const boxes = new InstancedMesh(this.box, this.frameMat, capacity);
    const plane = new PlaneGeometry(1, 1);
    const cells = new InstancedBufferAttribute(new Float32Array(capacity * 2), 2);
    cells.setUsage(DynamicDrawUsage);
    plane.setAttribute("cabAt", cells);
    const faces = new InstancedMesh(plane, this.faceMat, capacity);
    for (const m of [boxes, faces]) {
      m.instanceMatrix.setUsage(DynamicDrawUsage);
      m.frustumCulled = false;
      m.count = 0;
    }
    return [boxes, faces, cells];
  }

  /** Places every car; returns the replacement meshes when the old ones were too small. */
  update(transports: readonly RenderTransport[], now: number): readonly InstancedMesh[] {
    this.drawn.tick(now);
    let n = 0;
    for (const t of transports) if (FRAME[t.kind] !== undefined) n += t.carPositions.length;
    let swapped: readonly InstancedMesh[] = [];
    if (n > this.boxes.instanceMatrix.count) {
      const old = [this.boxes, this.faces];
      [this.boxes, this.faces, this.cells] = this.make(Math.max(n, this.boxes.instanceMatrix.count * 2));
      for (const m of old) {
        m.removeFromParent();
        if (m === old[1]) m.geometry.dispose();
        m.dispose();
      }
      swapped = this.meshes;
    }
    const h = STORY - SLAB - 0.15;
    const front = -DEPTH * 0.2;
    let i = 0;
    for (const t of transports) {
      const frame = FRAME[t.kind];
      if (frame === undefined) continue;
      t.carPositions.forEach((at, c) => {
        const w = t.width - 0.3;
        const cx = t.x + t.width / 2;
        const cy = this.drawn.at(`${t.id}:${c}`, 0, at).y * STORY + 0.05 + h / 2;
        m4.makeScale(w, h, DEPTH * 0.6);
        m4.setPosition(cx, cy, -DEPTH * 0.5);
        this.boxes.setMatrixAt(i, m4);
        this.boxes.setColorAt(i, tint.setHex(frame));
        m4.makeScale(w, h, 1);
        m4.setPosition(cx, cy, front + 0.01);
        this.faces.setMatrixAt(i, m4);
        const [u, v] = cabCell(t.kind, t.carLoad?.[c] ?? 0, t.carDir[c] ?? 0);
        this.cells.setXY(i, u, v);
        i++;
      });
    }
    this.drawn.prune(i * 2);
    for (const m of [this.boxes, this.faces]) {
      m.count = i;
      m.instanceMatrix.needsUpdate = true;
    }
    if (this.boxes.instanceColor) this.boxes.instanceColor.needsUpdate = true;
    this.cells.needsUpdate = true;
    return swapped;
  }

  dispose(): void {
    this.boxes.dispose();
    this.faces.geometry.dispose();
    this.faces.dispose();
    this.box.dispose();
    this.frameMat.dispose();
    this.faceMat.dispose();
    this.texture.dispose();
  }
}
