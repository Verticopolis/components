/**
 * The Map window (`windows/overviewMapWindow`) on a frame page of its own
 * (site/src/pages/frames/map-window.astro), over a made-up tower: hand-written
 * rooms, shafts, states, tiers and heat cells, never a game's. The frame is
 * the game's stage, so the window docks where it does in the game and takes
 * the phone layout in a phone-wide frame. A press or a drag on the map moves
 * a pretend camera, and the line under the stage says where it is and what a
 * tap landed on.
 */
import { render, html } from "lit-html";
import { OverviewMapWindow, type MutableMapCamera, type OverviewMapSource } from "../lib/ui/overviewMapWindow.js";
import { OverviewMapViews, type MapViewRoom } from "../lib/ui/overviewMapViews.js";
import type { MapCameraCenter } from "../lib/render/overviewMap/geometry.js";
import type { EvalTier, FacilityKind, RenderRoomTiers, RentTier, UnitState } from "../lib/render/renderModel.js";
import { FLOOR, TILE } from "../lib/render/scale.js";
import { floorTag } from "../lib/ui/format.js";
import { applyScheme, isScheme, DEFAULT_SCHEME } from "../lib/ui/schemes.js";
import { SCHEME_KEY } from "../site/schemeKey.mjs";

/** The lot: 120 tiles wide, three basement levels, room to grow to floor 40. */
const WORLD = { lotWidth: 120, minFloor: -2, maxFloor: 40 } as const;
const TOP = 24;

/** Each made-up kind's height in floors. */
const FLOORS: Partial<Record<FacilityKind, number>> = { cinema: 2, lobby: 1 };
const floorsOf = (kind: FacilityKind): number => FLOORS[kind] ?? 1;

type Room = MapViewRoom & { readonly id: number; evalTier: EvalTier; rentTier: RentTier };

/** The tiers the sample rooms take in turn. */
const EVAL_CYCLE: readonly EvalTier[] = ["good", "excellent", "good", "terrible", "excellent", "good"];
const RENT_CYCLE: readonly RentTier[] = ["average", "low", "high", "average", "veryLow", "average", "high"];

/** A tower floor by floor: offices low, then shops, hotel rooms and condos,
 *  with a cinema near the top and parking under the ground. */
function sampleRooms(): Room[] {
  const rooms: Room[] = [];
  let id = 1;
  const add = (kind: FacilityKind, floor: number, x: number, width: number, state: UnitState = "occupied") => {
    const n = id++;
    const evalTier = EVAL_CYCLE[n % EVAL_CYCLE.length];
    const rentTier = RENT_CYCLE[n % RENT_CYCLE.length];
    rooms.push({ id: n, kind, floor, x, width, state, evalTier, rentTier });
  };
  for (let floor = -2; floor <= 0; floor++) for (let x = 30; x < 90; x += 12) add("parking", floor, x, 12);
  for (let floor = 2; floor <= 8; floor++) for (let x = 30; x < 90; x += 9) add("office", floor, x, 9);
  for (let x = 30; x < 90; x += 15) add(x === 45 ? "fastFood" : "shop", 9, x, 15);
  const hotelStates: UnitState[] = ["occupied", "asleep", "dirty", "empty", "occupied", "infested"];
  for (let floor = 10; floor <= 16; floor++)
    for (let x = 30, i = floor; x < 90; x += 4, i++)
      add("hotelSingle", floor, x, 4, hotelStates[i % hotelStates.length]);
  for (let floor = 17; floor <= 21; floor++) for (let x = 30; x < 90; x += 16) add("condo", floor, x, 16);
  add("cinema", 22, 40, 31);
  return rooms;
}

const ROOMS = sampleRooms();
const ROOM_BY_ID = new Map(ROOMS.map((room) => [room.id, room]));

const SOURCE: OverviewMapSource = {
  view: {
    structure: [
      { kind: "lobby", floor: 1, x: 30, width: 60, count: 1 },
      ...Array.from({ length: TOP + 3 }, (_, i) => ({
        kind: "floor" as const,
        floor: i - 2,
        x: 30,
        width: 60,
        count: 1,
      })).filter((run) => run.floor !== 1),
    ],
    rooms: ROOMS,
    tower: {
      lowestFloor: -2,
      highestFloor: TOP,
      transports: [
        { kind: "elevatorStandard", x: 26, width: 4, bottom: -2, top: TOP },
        { kind: "elevatorExpress", x: 90, width: 4, bottom: 1, top: TOP },
        { kind: "stairs", x: 60, width: 2, bottom: 1, top: 3 },
      ],
    },
  },
  world: WORLD,
};

/** The rooms' tiers, as a game would hand them over: one row per room. */
const TIERS: RenderRoomTiers = {
  size: ROOMS.length,
  id: (i) => ROOMS[i].id,
  floor: (i) => ROOMS[i].floor,
  x: (i) => ROOMS[i].x,
  evalTier: (i) => ROOMS[i].evalTier,
  rentTier: (i) => ROOMS[i].rentTier,
};

/** The lines at the lobby, then the hotel floors, then quiet. */
function congestion(floor: number): number {
  if (floor === 1) return 0.9;
  if (floor >= 10 && floor <= 16) return 0.55;
  return 0.15;
}

/** Heat on every floor, worst near the lobby and the hotel. */
function heatCells(mode: string) {
  return Array.from({ length: TOP + 3 }, (_, i) => {
    const floor = i - 2;
    return { floor, minX: 30, maxX: 90, severity: mode === "congestion" ? congestion(floor) : ((floor * 7) % 10) / 10 };
  });
}

/** Mount the window in the frame's stage. */
export function mountMapWindow(): void {
  const stage = document.getElementById("stage");
  const line = document.getElementById("g-map-said");
  if (!stage || !line) return;
  const cam: MutableMapCamera = {
    posX: 60 * TILE,
    posY: -12 * FLOOR,
    zoom: 1,
    viewWidth: 70 * TILE,
    viewHeight: 14 * FLOOR,
  };
  let said = "Drag the view box, or tap anywhere on the map.";
  const say = () => render(html`${said}`, line);
  const views = new OverviewMapViews({
    rooms: () => ROOMS,
    minutes: () => 9 * 60,
    floorsOf,
    tiers: { read: () => TIERS },
    roomById: (id) => ROOM_BY_ID.get(id),
    heat: { cells: heatCells, towerRevision: () => 1, mealRevision: () => 1 },
  });
  const map = new OverviewMapWindow({
    stage,
    source: () => SOURCE,
    readCamera: (out) => Object.assign(out, cam),
    moveCamera: (center: MapCameraCenter) => {
      const tile = Math.max(0, Math.min(WORLD.lotWidth, center.tile));
      const floor = Math.max(WORLD.minFloor, Math.min(WORLD.maxFloor, center.floor));
      cam.posX = tile * TILE;
      cam.posY = -floor * FLOOR;
      said = `The view is centered on floor ${floorTag(Math.round(floor))}.`;
      say();
    },
    floorsOf,
    isPhone: () => window.matchMedia("(max-width: 767px)").matches,
    storage: null,
    tapped: () => {
      said = `${said} A game opens the card of what the selected view shows there.`;
      say();
    },
    views,
  });
  map.setOpen(true, false);
  say();
  const tick = () => {
    map.frame();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.addEventListener("resize", () => map.layoutChanged());
  followScheme();
  (window as unknown as { galleryReady?: boolean }).galleryReady = true;
}

/** The gallery keeps the picked scheme in local storage; a pick on the page
 *  around the frame reaches the frame as a storage event. */
function followScheme(): void {
  window.addEventListener("storage", (e) => {
    if (e.key !== SCHEME_KEY) return;
    applyScheme(isScheme(e.newValue) ? e.newValue : DEFAULT_SCHEME, document.documentElement);
  });
}
