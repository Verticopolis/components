/**
 * The voxel look of the Tower in 3D: the game's own pixel art given depth.
 * A flat cutout (a person, or a room's furniture layer) is stacked into a
 * few copies one art pixel apart, so from an angle its edges read as solid
 * blocks the color of the pixels they extrude. The copies inside the stack
 * are shaded darker so the sides read as sides. It costs one more quad per
 * copy and no new texture.
 */
import { BufferAttribute, BufferGeometry } from "three";
import { TILE } from "../render/scale";

/** One art pixel, in world units: the spacing of a stack's copies. */
export const VOXEL = 1 / TILE;
/** How dark the copies inside a stack are, against its outer faces. */
export const SIDE_SHADE = 0.68;

/**
 * A unit quad (centered, facing +z) stacked `slices` times along z, `step`
 * apart and centered on z = 0, with a vertex color that darkens the inner
 * copies. UVs are the plain quad's on every copy.
 */
export function slabStack(slices: number, step = VOXEL): BufferGeometry {
  const n = Math.max(1, slices);
  const pos = new Float32Array(n * 12);
  const uv = new Float32Array(n * 8);
  const col = new Float32Array(n * 12);
  const idx = new Uint16Array(n * 6);
  for (let i = 0; i < n; i++) {
    const z = (i - (n - 1) / 2) * step;
    pos.set([-0.5, -0.5, z, 0.5, -0.5, z, 0.5, 0.5, z, -0.5, 0.5, z], i * 12);
    uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
    const s = i === 0 || i === n - 1 ? 1 : SIDE_SHADE;
    col.fill(s, i * 12, i * 12 + 12);
    const b = i * 4;
    idx.set([b, b + 1, b + 2, b, b + 2, b + 3], i * 6);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setAttribute("color", new BufferAttribute(col, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}

/** The shade of copy `i` of a stack of `slices` laid behind a front face (copy 0). */
export function shadeOf(i: number, slices: number): number {
  return i === 0 || i === slices - 1 ? 1 : SIDE_SHADE;
}
