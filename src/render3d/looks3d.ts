/**
 * The Tower in 3D look: one entry per facility kind, so a kind the render
 * model can send never draws as a gray placeholder. Every color and piece of
 * furniture is made here in code, original to Verticopolis.
 *
 * A room is a shallow box seen through its open front: a back wall, a floor,
 * side walls, and a few pieces of furniture. Furniture is written in the
 * room's own units: `x` and `w` in tiles from the room's left edge, `h` and
 * `top` as fractions of the story height, `z0` to `z1` as fractions of the
 * room's depth from the front (0) to the back wall (1).
 */
import type { FacilityKind } from "../render/renderModel";

export type Rgb = readonly [number, number, number];

/** One piece of furniture in room units. */
export interface Piece {
  readonly x: number;
  readonly w: number;
  readonly h: number;
  readonly top?: number;
  readonly z0: number;
  readonly z1: number;
  readonly c: Rgb;
}

/** How a kind draws in 3D. */
export interface Look3d {
  readonly wall: Rgb;
  readonly floor: Rgb;
  readonly accent: Rgb;
  /** The warm light the room gives off at night, or null for a dark room. */
  readonly night: Rgb | null;
  /** The furniture for a room `w` tiles wide; `seed` varies it per room. */
  readonly furnish: (w: number, seed: number) => Piece[];
}

const WOOD: Rgb = [130, 96, 64];
const DARK_WOOD: Rgb = [100, 74, 52];
const LINEN: Rgb = [244, 244, 240];
const PLANT: Rgb = [70, 140, 80];
const SCREEN: Rgb = [40, 46, 58];
const STEEL: Rgb = [150, 154, 162];
const WARM: Rgb = [255, 214, 150];
const COOL: Rgb = [190, 210, 255];

/** Repeats `make` every `step` tiles across a room `w` wide. */
function across(w: number, start: number, step: number, width: number, make: (x: number) => Piece[]): Piece[] {
  const out: Piece[] = [];
  for (let x = start; x + width <= w - 0.3; x += step) out.push(...make(x));
  return out;
}

const desks =
  (accent: Rgb) =>
  (w: number): Piece[] => [
    ...across(w, 0.6, 3, 2.4, (x) => [
      { x, w: 2.2, h: 0.24, z0: 0.35, z1: 0.6, c: WOOD },
      { x: x + 0.6, w: 1, h: 0.2, top: 0.24, z0: 0.48, z1: 0.52, c: SCREEN },
      { x: x + 0.9, w: 0.7, h: 0.18, z0: 0.15, z1: 0.3, c: accent },
    ]),
    { x: w - 0.9, w: 0.6, h: 0.45, z0: 0.82, z1: 0.95, c: PLANT },
  ];

const home =
  (accent: Rgb) =>
  (w: number): Piece[] => {
    const out: Piece[] = [
      { x: 1, w: Math.min(4.5, w - 2), h: 0.22, z0: 0.6, z1: 0.92, c: accent },
      { x: 1, w: Math.min(4.5, w - 2), h: 0.18, top: 0.22, z0: 0.85, z1: 0.95, c: accent },
    ];
    if (w >= 10) {
      out.push({ x: 7, w: 2.8, h: 0.5, z0: 0.82, z1: 0.96, c: DARK_WOOD });
      out.push({ x: w - 4.6, w: 3.6, h: 0.25, z0: 0.5, z1: 0.9, c: LINEN });
    }
    return out;
  };

const beds =
  (accent: Rgb, bed: number) =>
  (w: number): Piece[] => [
    { x: 0.6, w: Math.min(bed, w - 1.6), h: 0.2, z0: 0.4, z1: 0.95, c: LINEN },
    { x: 0.6, w: Math.min(bed, w - 1.6), h: 0.06, top: 0.2, z0: 0.4, z1: 0.72, c: accent },
    { x: Math.min(0.8 + bed, w - 0.8), w: 0.6, h: 0.22, z0: 0.85, z1: 0.97, c: DARK_WOOD },
  ];

const tables =
  (accent: Rgb, step: number) =>
  (w: number): Piece[] =>
    across(w, 1, step, 2.6, (x) => [
      { x, w: 1.8, h: 0.22, z0: 0.35, z1: 0.65, c: LINEN },
      { x: x - 0.5, w: 0.4, h: 0.3, z0: 0.42, z1: 0.58, c: accent },
      { x: x + 1.9, w: 0.4, h: 0.3, z0: 0.42, z1: 0.58, c: accent },
    ]);

const shelves =
  (accent: Rgb) =>
  (w: number): Piece[] => [
    ...across(w, 0.8, 2.6, 1.6, (x) => [{ x, w: 1.6, h: 0.55, z0: 0.82, z1: 0.97, c: accent }]),
    { x: Math.max(0.5, w - 3.5), w: Math.min(2.5, w - 1), h: 0.3, z0: 0.2, z1: 0.35, c: WOOD },
  ];

const seats =
  (accent: Rgb) =>
  (w: number): Piece[] => [
    { x: 1, w: w - 2, h: 0.7, top: 0.15, z0: 0.94, z1: 0.99, c: [236, 236, 244] },
    ...across(w, 1.5, 1.4, 1, (x) => [{ x, w: 1, h: 0.2, z0: 0.15, z1: 0.75, c: accent }]),
  ];

const machines =
  (accent: Rgb) =>
  (w: number): Piece[] =>
    across(w, 0.8, 2.2, 1.2, (x) => [{ x, w: 1.2, h: 0.45, z0: 0.6, z1: 0.9, c: accent }]);

const pool =
  (water: Rgb) =>
  (w: number): Piece[] => [
    { x: 1, w: w - 2, h: 0.05, z0: 0.2, z1: 0.85, c: water },
    { x: 0.4, w: 0.4, h: 0.3, z0: 0.3, z1: 0.8, c: STEEL },
  ];

const cars = (w: number, seed: number): Piece[] =>
  across(w, 0.6, 3.2, 2.6, (x) => {
    const pick = (Math.floor(x) * 31 + seed) % 4;
    const paint: Rgb[] = [
      [190, 60, 50],
      [60, 90, 160],
      [230, 230, 226],
      [60, 64, 70],
    ];
    return [
      { x, w: 2.4, h: 0.16, z0: 0.3, z1: 0.75, c: paint[pick] ?? paint[0]! },
      { x: x + 0.5, w: 1.4, h: 0.1, top: 0.16, z0: 0.36, z1: 0.7, c: [170, 200, 220] },
    ];
  });

const bare = (): Piece[] => [];

const look = (
  wall: Rgb,
  floor: Rgb,
  accent: Rgb,
  night: Rgb | null,
  furnish: (w: number, seed: number) => Piece[],
): Look3d => ({
  wall,
  floor,
  accent,
  night,
  // A room too narrow for a piece leaves it out, so nothing pokes through a wall.
  furnish: (w, seed) => furnish(w, seed).filter((p) => p.w > 0 && p.x >= 0 && p.x + p.w <= w),
});

/** Every facility kind's 3D look. The record type makes a missing kind a compile error. */
export const LOOKS_3D: Readonly<Record<FacilityKind, Look3d>> = {
  lobby: look([230, 222, 206], [196, 186, 168], [150, 130, 100], WARM, (w) => [
    ...across(w, 3, 6, 0.8, (x) => [{ x, w: 0.8, h: 1, z0: 0.45, z1: 0.6, c: [236, 230, 218] }]),
    { x: 1, w: 0.9, h: 0.5, z0: 0.8, z1: 0.95, c: PLANT },
  ]),
  floor: look([176, 176, 172], [140, 140, 136], [120, 120, 120], null, bare),
  office: look([214, 224, 234], [150, 160, 172], [70, 110, 160], COOL, desks([70, 110, 160])),
  condo: look([238, 226, 204], [176, 140, 104], [120, 150, 90], WARM, home([120, 150, 90])),
  rentalStudio: look([232, 222, 236], [160, 140, 170], [140, 110, 170], WARM, home([140, 110, 170])),
  rentalApartment: look([226, 232, 214], [150, 160, 120], [110, 140, 80], WARM, home([110, 140, 80])),
  hotelSingle: look([226, 200, 204], [150, 110, 116], [170, 70, 90], WARM, beds([170, 70, 90], 2.2)),
  hotelDouble: look([222, 206, 190], [150, 120, 100], [160, 110, 60], WARM, beds([160, 110, 60], 3.2)),
  hotelSuite: look([214, 198, 226], [130, 110, 150], [110, 80, 150], WARM, (w, s) => [
    ...beds([110, 80, 150], 3.4)(w),
    { x: Math.max(5, w - 4), w: 3, h: 0.22, z0: 0.65, z1: 0.92, c: [200, 160, 90] },
    ...(s % 2 ? [{ x: Math.max(4.4, w - 1.2), w: 0.6, h: 0.45, z0: 0.82, z1: 0.95, c: PLANT }] : []),
  ]),
  fastFood: look([244, 228, 160], [170, 150, 90], [210, 90, 40], WARM, (w) => [
    ...tables([210, 90, 40], 3.2)(w),
    { x: 0.5, w: w - 1, h: 0.3, z0: 0.82, z1: 0.95, c: [200, 80, 50] },
  ]),
  restaurant: look([236, 204, 168], [140, 96, 70], [190, 80, 50], WARM, tables([190, 80, 50], 3.2)),
  foodHall: look([240, 220, 190], [160, 130, 100], [200, 120, 60], WARM, tables([200, 120, 60], 2.8)),
  shop: look([200, 230, 220], [150, 170, 160], [40, 140, 120], WARM, shelves([40, 140, 120])),
  boutiqueBay: look([236, 214, 226], [170, 140, 156], [190, 90, 140], WARM, shelves([190, 90, 140])),
  cinema: look([60, 40, 50], [90, 50, 60], [170, 40, 50], [255, 190, 140], seats([170, 40, 50])),
  partyHall: look([240, 214, 200], [170, 120, 110], [200, 80, 100], WARM, tables([200, 80, 100], 3.6)),
  weddingHall: look([246, 240, 232], [200, 186, 170], [220, 180, 200], WARM, (w) => [
    ...tables([220, 180, 200], 4)(w),
    { x: w / 2 - 1.5, w: 3, h: 0.08, z0: 0.05, z1: 0.95, c: [230, 230, 236] },
  ]),
  amusements: look([90, 70, 140], [70, 60, 110], [240, 200, 60], [220, 170, 255], machines([240, 200, 60])),
  nightclub: look([40, 36, 60], [50, 40, 80], [220, 60, 200], [255, 120, 230], (w) => [
    { x: 1, w: w - 2, h: 0.04, z0: 0.2, z1: 0.8, c: [120, 80, 200] },
    { x: w - 4, w: 3, h: 0.35, z0: 0.8, z1: 0.95, c: [220, 60, 200] },
  ]),
  skyBar: look([60, 70, 96], [80, 70, 60], [230, 170, 80], WARM, (w) => [
    { x: 1, w: Math.min(6, w - 2), h: 0.33, z0: 0.75, z1: 0.92, c: DARK_WOOD },
    ...tables([230, 170, 80], 3.4)(w).filter((p) => p.x > 7.5),
  ]),
  fitnessClub: look([214, 230, 236], [120, 140, 150], [230, 120, 40], COOL, machines([60, 64, 70])),
  spa: look([220, 236, 228], [170, 190, 180], [90, 170, 160], WARM, pool([120, 200, 210])),
  aquaticCenter: look([200, 228, 240], [170, 200, 214], [40, 120, 200], COOL, pool([70, 160, 220])),
  clinic: look([236, 242, 246], [190, 200, 206], [80, 160, 200], COOL, beds([80, 160, 200], 2.4)),
  daycare: look([250, 236, 190], [200, 170, 120], [230, 110, 90], WARM, (w) =>
    across(w, 0.8, 2.4, 1.2, (x) => [
      { x, w: 1.2, h: 0.14, z0: 0.4, z1: 0.6, c: x % 2 > 1 ? [230, 110, 90] : [90, 150, 220] },
    ]),
  ),
  stairs: look([150, 140, 126], [120, 112, 100], [90, 84, 76], null, bare),
  escalator: look([150, 156, 166], [120, 124, 132], [80, 84, 92], null, bare),
  elevatorStandard: look([58, 64, 78], [44, 48, 58], [180, 186, 196], null, bare),
  elevatorService: look([70, 66, 58], [50, 48, 44], [200, 180, 140], null, bare),
  elevatorExpress: look([52, 56, 96], [40, 42, 72], [190, 196, 230], null, bare),
  parkingRamp: look([120, 124, 130], [90, 92, 98], [230, 200, 60], null, (w) => [
    { x: 0.5, w: w - 1, h: 0.04, z0: 0.45, z1: 0.55, c: [230, 200, 60] },
  ]),
  parking: look([120, 124, 130], [90, 92, 98], [230, 200, 60], null, cars),
  security: look([210, 214, 224], [120, 126, 140], [50, 70, 130], COOL, desks([50, 70, 130])),
  medical: look([236, 242, 246], [190, 200, 206], [200, 60, 60], COOL, beds([200, 60, 60], 2.4)),
  housekeeping: look([226, 230, 220], [160, 166, 150], [120, 150, 180], null, machines([230, 232, 236])),
  recycling: look([150, 160, 140], [110, 120, 100], [70, 140, 70], null, machines([70, 140, 70])),
  metro: look([170, 176, 186], [110, 114, 124], [220, 180, 40], COOL, (w) => [
    { x: 0, w, h: 0.2, z0: 0.05, z1: 0.45, c: [90, 94, 102] },
    { x: 0.4, w: w - 0.8, h: 0.02, top: 0.2, z0: 0.4, z1: 0.45, c: [220, 180, 40] },
  ]),
};

/** The construction look: scaffold and bare slab, whatever the kind. */
export const CONSTRUCTION: Look3d = look([196, 176, 120], [150, 140, 120], [230, 160, 40], null, (w) =>
  across(w, 0.5, 3, 0.2, (x) => [{ x, w: 0.2, h: 1, z0: 0.05, z1: 0.1, c: [230, 160, 40] }]),
);

/** The look after a fire. */
export const GUTTED: Look3d = look([70, 64, 60], [60, 56, 52], [40, 36, 34], null, bare);

/** A unit's look for its kind and state. */
export function lookFor(kind: FacilityKind, state: string): Look3d {
  if (state === "construction") return CONSTRUCTION;
  if (state === "gutted") return GUTTED;
  return LOOKS_3D[kind];
}
