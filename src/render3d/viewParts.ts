/**
 * Pieces of the Tower in 3D view kept out of `Tower3dView.ts`: what one band
 * draws with, the camera's limits for a lot, the built span the opening view
 * frames, and the sky's gradient.
 */
import { CanvasTexture, Color, SRGBColorSpace, type Material, type Mesh } from "three";
import type { RenderSim, RenderUnit } from "../render/renderModel";
import type { ArtPaint, BandArt } from "./bandArt";
import type { Tier } from "./quality";
import type { TimeOfDay } from "./sky3d";
import { bandOf, SLAB, STORY } from "./bandGeometry";
import type { FrameBox, OrbitLimits } from "./camera3d";

export interface BandMesh {
  readonly solid: Mesh | null;
  readonly glow: Mesh | null;
  /** The game's room art on the back walls, in the art look. */
  readonly art: { readonly paint: BandArt; readonly mesh: Mesh } | null;
}

/** The camera's limits for a lot `lotWidth` tiles wide, built from `lowestFloor` to `highestFloor`. */
export function lotLimits(lotWidth: number, lowestFloor: number, highestFloor: number): OrbitLimits {
  const low = Math.min(1, lowestFloor);
  const high = Math.max(2, highestFloor + 1);
  const minY = low * STORY - SLAB;
  const maxY = high * STORY;
  const reach = Math.max(lotWidth, maxY - minY);
  return {
    minX: -10,
    maxX: lotWidth + 10,
    minY,
    maxY,
    minRadius: STORY * 6,
    maxRadius: reach * 8,
    floorY: minY + 1,
  };
}

/** The units whose base floor is in `band`, read fresh. */
export function unitsIn(sim: RenderSim, band: number): RenderUnit[] {
  return sim.tower.units.filter((u) => bandOf(u.floor) === band);
}

/** The span of built rooms, floor to roof; the lot when nothing is built. */
export function builtBox(units: ReadonlyArray<RenderUnit>, l: OrbitLimits): FrameBox {
  let minX = Infinity;
  let maxX = -Infinity;
  for (const u of units) {
    minX = Math.min(minX, u.x);
    maxX = Math.max(maxX, u.x + u.width);
  }
  if (!(maxX > minX)) return l;
  return { minX: minX - 4, maxX: maxX + 4, minY: l.minY, maxY: l.maxY };
}

export function disposeBand(b: BandMesh): void {
  for (const m of [b.solid, b.glow]) {
    if (!m) continue;
    m.geometry.dispose();
    m.removeFromParent();
  }
  if (b.art) {
    b.art.mesh.removeFromParent();
    (b.art.mesh.material as Material).dispose();
    b.art.paint.dispose();
  }
}

/** A vertical sky gradient as a background texture. */
export function gradient(top: number, bottom: number): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, `#${new Color(top).getHexString()}`);
  gr.addColorStop(1, `#${new Color(bottom).getHexString()}`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Frames between two art repaints; each repaint redraws one band. */
export const REPAINT_EVERY = 6;

/** The people window's reach above and below the camera's floor, by tier. */
const PEOPLE_FLOORS: Readonly<Record<Tier, number>> = { low: 8, medium: 12, high: 16 };

/** The floors and tiles the simulation sends people for. */
export interface PeopleWindow {
  readonly floorLo: number;
  readonly floorHi: number;
  readonly xLo: number;
  readonly xHi: number;
}

/** The whole lot across, and a tier's reach above and below floor `focus`. */
export function peopleWindowAt(focus: number, tier: Tier, lotWidth: number): PeopleWindow {
  const f = Math.round(focus);
  const reach = PEOPLE_FLOORS[tier];
  return { floorLo: f - reach, floorHi: f + reach, xLo: 0, xHi: lotWidth };
}

/** How the room art paints at `time`: the game's evening look from dusk on. */
export function artLookAt(time: TimeOfDay, hour: number): ArtPaint {
  return { lit: time !== "day", hour, anim: performance.now() / 1000 };
}

/** The art's tint: full color by day, a little warm at dusk, as painted at night. */
export function artTintAt(time: TimeOfDay | null): number {
  return time === "dusk" ? 0xf2e2d2 : 0xffffff;
}

/** The numbers the gate records. */
export interface Tower3dStats {
  readonly tier: Tier;
  readonly frameP50: number;
  readonly frameP90: number;
  readonly frameP95: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly geometries: number;
  readonly bands: number;
  readonly people: number;
  readonly cars: number;
  readonly pixelRatio: number;
  /** Milliseconds the last band rebuild took. */
  readonly lastBuildMs: number;
}
