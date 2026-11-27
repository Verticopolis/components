/**
 * The lot around the tower: earth cut open on the front face so the
 * basements show, grass and a sidewalk at street level, a street behind the
 * tower (its traffic is `Traffic` in movers3d), trees, and plain neighbor blocks in the
 * distance. One merged buffer, rebuilt only when the lot or the basements
 * change. Floor 1 is the ground floor; floors 0 and below are basements.
 */
import type { BufferGeometry } from "three";
import { BoxWriter, FACE } from "./boxWriter";
import { DEPTH, SLAB, STORY, uncovered, type Run } from "./bandGeometry";
import type { Rgb } from "./looks3d";

/** The y of the ground surface: the top of the ground floor's slab. */
export const GROUND_Y = STORY - SLAB;

const DIRT: Rgb = [122, 96, 72];
const GRASS: Rgb = [112, 152, 88];
const WALK: Rgb = [190, 188, 182];
const ROAD: Rgb = [72, 74, 80];
const LANE: Rgb = [230, 220, 140];
const TRUNK: Rgb = [96, 70, 50];
const CROWN: Rgb = [72, 128, 70];
const NEIGHBOR: Rgb = [150, 168, 190];

export interface LotInput {
  readonly lotWidth: number;
  /** The lowest floor anything is built on (1 when there are no basements). */
  readonly lowestFloor: number;
  /** Each basement row's runs of built tiles. */
  readonly rows: ReadonlyMap<number, readonly Run[]>;
}

/** Builds the lot. Pure: the same input gives the same buffer. */
export function buildLot(input: LotInput): BufferGeometry | null {
  const w = new BoxWriter(256);
  const W = input.lotWidth;
  const low = Math.min(1, input.lowestFloor);
  const bottom = low * STORY - SLAB;
  const deep = bottom - 40;
  const g = GROUND_Y;
  // Earth: either side of the lot, behind the rooms, and under the lowest basement.
  w.box(-160, deep, -90, 0, g, 0, DIRT, FACE.back | FACE.bottom);
  w.box(W, deep, -90, W + 160, g, 0, DIRT, FACE.back | FACE.bottom);
  w.box(0, deep, -90, W, g, -DEPTH - 0.25, DIRT, FACE.back | FACE.bottom);
  w.box(0, deep, -DEPTH - 0.25, W, bottom, 0, DIRT, FACE.back | FACE.bottom);
  // Earth where a basement row has no rooms, so the cut reads as solid ground.
  for (let f = low; f <= 0; f++) {
    const y0 = f * STORY - SLAB;
    for (const open of uncovered({ min: 0, max: W }, input.rows.get(f) ?? [])) {
      w.box(open.min, y0, -DEPTH - 0.25, open.max, y0 + STORY, 0, DIRT, FACE.back | FACE.bottom);
    }
  }
  // Street level.
  w.box(-160, g, -90, 0, g + 0.05, 0, GRASS, ~FACE.top);
  w.box(W, g, -90, W + 160, g + 0.05, 0, GRASS, ~FACE.top);
  w.box(0, g, -90, W, g + 0.05, -DEPTH - 0.25, GRASS, ~FACE.top);
  w.box(-14, g + 0.05, -DEPTH - 4, W + 14, g + 0.12, -DEPTH - 0.25, WALK, FACE.bottom | FACE.back);
  w.box(-14, g + 0.05, -DEPTH - 0.25, 0, g + 0.12, 0, WALK, FACE.bottom | FACE.back);
  w.box(W, g + 0.05, -DEPTH - 0.25, W + 14, g + 0.12, 0, WALK, FACE.bottom | FACE.back);
  w.box(-90, g + 0.05, -DEPTH - 14, W + 90, g + 0.1, -DEPTH - 4, ROAD, ~FACE.top);
  for (let x = -80; x < W + 80; x += 6) w.box(x, g + 0.1, -DEPTH - 9.1, x + 3, g + 0.12, -DEPTH - 8.9, LANE, ~FACE.top);
  for (const [x, z] of [
    [-6, -3],
    [-10, -10],
    [W + 6, -3],
    [W + 10, -10],
    [-26, -5],
    [W + 24, -5],
  ] as const) {
    w.box(x - 0.3, g, z - 0.3, x + 0.3, g + 2.6, z + 0.3, TRUNK, FACE.bottom);
    w.box(x - 1.8, g + 2.2, z - 1.8, x + 1.8, g + 5, z + 1.8, CROWN, 0);
  }
  // Neighbors in the distance, set back past the street.
  for (const [x, h, wide] of [
    [-80, 44, 20],
    [-55, 28, 16],
    [-30, 58, 14],
    [W + 14, 50, 18],
    [W + 40, 32, 22],
    [W + 66, 66, 16],
    [W * 0.2, 38, 22],
    [W * 0.6, 62, 18],
  ] as const) {
    const z = -70 - (Math.abs(Math.round(x)) % 3) * 8;
    w.box(x, g, z - wide, x + wide, g + h, z, NEIGHBOR, FACE.bottom);
  }
  return w.geometry();
}
