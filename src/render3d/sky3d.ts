/**
 * Time of day for the Tower in 3D: the game clock picks day, dusk or night
 * (as the side view's sky does), or the player pins one for the window.
 * Each look variant sets how strong the sun is and how flat the shading is.
 */

export type TimeOfDay = "day" | "dusk" | "night";
export type TimeChoice = "follow" | TimeOfDay;

/**
 * The looks the owner picks between (Story 1.3); "art" hangs the game's own
 * room art on the walls, and "voxel" gives that art and the people depth
 * (`voxel3d.ts`).
 */
export type LookVariant = "art" | "voxel" | "pastel" | "lit" | "night";

/** Whether a look hangs the game's own room art. */
export function isArt(variant: LookVariant): boolean {
  return variant === "art" || variant === "voxel";
}

/** The part of the day the clock's hour falls in. */
export function timeOfDayAt(hour: number): TimeOfDay {
  if (hour >= 7 && hour < 17) return "day";
  if ((hour >= 17 && hour < 20) || (hour >= 5 && hour < 7)) return "dusk";
  return "night";
}

/** What the scene's light is set to for one time of day. */
export interface SkyLight {
  readonly top: number;
  readonly bottom: number;
  readonly fog: number;
  readonly hemiSky: number;
  readonly hemiGround: number;
  readonly hemi: number;
  readonly sun: number;
  readonly sunColor: number;
  /** The sun's direction, toward the scene, as [x, y, z] (normalized by the caller). */
  readonly sunFrom: readonly [number, number, number];
  /** How bright the rooms' night lights draw, 0 for off. */
  readonly glow: number;
  readonly exposure: number;
}

const SKIES: Readonly<Record<TimeOfDay, SkyLight>> = {
  day: {
    top: 0x5f9ad6,
    bottom: 0xcfe4f2,
    fog: 0xcfe4f2,
    hemiSky: 0xdfefff,
    hemiGround: 0x6b5a44,
    hemi: 1.1,
    sun: 2.4,
    sunColor: 0xfff4e0,
    sunFrom: [0.4, 0.8, 0.6],
    glow: 0,
    exposure: 1,
  },
  dusk: {
    top: 0x1c2450,
    bottom: 0xf0946a,
    fog: 0x6a4a7a,
    hemiSky: 0x8a7ab8,
    hemiGround: 0x3a2a20,
    hemi: 0.9,
    sun: 0.7,
    sunColor: 0xff9a60,
    sunFrom: [0.9, 0.25, 0.5],
    glow: 0.85,
    exposure: 1.05,
  },
  night: {
    top: 0x060a1c,
    bottom: 0x1c2444,
    fog: 0x10162c,
    hemiSky: 0x3a4a80,
    hemiGround: 0x101018,
    hemi: 0.45,
    sun: 0.15,
    sunColor: 0x9ab0ff,
    sunFrom: [-0.3, 0.7, 0.6],
    glow: 1,
    exposure: 1.1,
  },
};

/** The light for `time` in look `variant`. */
export function skyLight(time: TimeOfDay, variant: LookVariant): SkyLight {
  const base = SKIES[time];
  if (variant === "pastel") {
    // Flat and soft: more fill, a weaker sun, so colors read as painted.
    return { ...base, hemi: base.hemi * 1.5, sun: base.sun * 0.45 };
  }
  return base;
}

/** The time of day to draw: the pinned one, or the clock's. */
export function resolveTime(choice: TimeChoice, hour: number): TimeOfDay {
  return choice === "follow" ? timeOfDayAt(hour) : choice;
}
