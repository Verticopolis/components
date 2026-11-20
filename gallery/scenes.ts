/**
 * The gallery's tower scenes: hand-written slices of a tower that show the
 * pieces a single cell cannot, the lobbies at each height, sky lobbies, and
 * stairs, escalators and elevators running across several floors with rooms
 * around them. Widths come from the gallery's catalog; every placement here
 * is the gallery's own.
 */
import type { FacilityKind } from "../lib/render/renderModel.js";
import type { Facts, Scene, SceneHall, SceneRoom, SceneShaft } from "./scene.js";

const W = 30;

interface Draft {
  title: string;
  caption: string;
  width?: number;
  bottom: number;
  top: number;
  halls?: SceneHall[];
  shafts?: SceneShaft[];
  rooms?: SceneRoom[];
  /** Kinds to fill each floor's open columns with, cycled left to right. */
  fill?: Record<number, FacilityKind[]>;
}

/** Turn a draft into a scene, filling each listed floor's open columns (not
 *  under a hall, a shaft or a placed room) with its kinds in turn. */
function build(facts: Facts, draft: Draft): Scene {
  const width = draft.width ?? W;
  const halls = draft.halls ?? [];
  const shafts = draft.shafts ?? [];
  const rooms = [...(draft.rooms ?? [])];
  const taken = (floor: number, x: number): boolean =>
    halls.some((h) => floor >= h.floor && floor < h.floor + h.height && x >= h.x0 && x <= h.x1) ||
    shafts.some((s) => floor >= s.bottom && floor <= s.top && x >= s.x && x < s.x + facts(s.kind).width) ||
    rooms.some((r) => {
      const f = facts(r.kind);
      return floor >= r.floor && floor < r.floor + f.floors && x >= r.x && x < r.x + f.width;
    });
  for (const [key, kinds] of Object.entries(draft.fill ?? {})) {
    const floor = Number(key);
    let next = 0;
    let x = 0;
    while (x < width) {
      if (taken(floor, x)) {
        x++;
        continue;
      }
      let run = 0;
      while (x + run < width && !taken(floor, x + run)) run++;
      // The next kind in turn that fits the open run, or none.
      let placed = false;
      for (let tries = 0; tries < kinds.length; tries++) {
        const kind = kinds[(next + tries) % kinds.length];
        if (facts(kind).width <= run) {
          rooms.push({ kind, floor, x });
          x += facts(kind).width;
          next = (next + tries + 1) % kinds.length;
          placed = true;
          break;
        }
      }
      if (!placed) x += run;
    }
    // A floor the draft asked to fill that took no room is a layout mistake.
    if (!rooms.some((r) => r.floor === floor))
      console.warn(`Gallery scene "${draft.title}": floor ${floor} has no room.`);
  }
  return {
    title: draft.title,
    caption: draft.caption,
    width,
    bottom: draft.bottom,
    top: draft.top,
    halls,
    rooms,
    shafts,
  };
}

/** A hall's height in words, for the scene titles. */
const STORIES: Record<number, string> = { 1: "one story", 2: "two stories", 3: "three stories" };

const OFFICES: FacilityKind[] = ["office"];
const HOTEL: FacilityKind[] = ["hotelDouble", "hotelSingle", "hotelSuite"];
const RETAIL: FacilityKind[] = ["shop", "fastFood"];

/** A ground lobby `height` stories tall with offices on the floor above it. */
function groundLobby(height: number): Draft {
  const stories = STORIES[height];
  return {
    title: `Ground lobby, ${stories}`,
    caption:
      height === 1
        ? "The front doors with the doorman on the left, the service door on the right."
        : "A tall ground lobby: one hall up to its ceiling, with the front doors on its bottom story.",
    bottom: 1,
    top: height + 1,
    halls: [{ floor: 1, x0: 0, x1: W - 1, height }],
    fill: { [height + 1]: OFFICES },
  };
}

/** A sky lobby on floor 15, `height` stories tall, between offices and hotel rooms. */
function skyLobby(height: number): Draft {
  const stories = STORIES[height];
  return {
    title: `Sky lobby, ${stories}`,
    caption:
      height === 1
        ? "A transfer floor up the tower: skyline glass, planters and prints instead of the front doors."
        : "A tall sky lobby (Modern): the transfer floor as one hall with pendant lights.",
    bottom: 14,
    top: 15 + height,
    halls: [{ floor: 15, x0: 0, x1: W - 1, height }],
    fill: { 14: OFFICES, [15 + height]: HOTEL },
  };
}

export function lobbyScenes(facts: Facts): Scene[] {
  const drafts: Draft[] = [
    groundLobby(1),
    groundLobby(2),
    groundLobby(3),
    skyLobby(1),
    skyLobby(2),
    skyLobby(3),
    {
      title: "Halls of two heights",
      caption: "Two ground halls of different heights side by side (Modern), with a revolving door in the wall.",
      bottom: 1,
      top: 4,
      halls: [
        { floor: 1, x0: 0, x1: 13, height: 3 },
        { floor: 1, x0: 14, x1: W - 1, height: 1 },
      ],
      fill: { 2: HOTEL, 3: HOTEL, 4: OFFICES },
    },
  ];
  return drafts.map((d) => build(facts, d));
}

export function stairScenes(facts: Facts): Scene[] {
  const drafts: Draft[] = [
    {
      title: "Stairs",
      caption: "Each stairway climbs one floor. Stacked one above the next, they make a stairwell up four floors.",
      bottom: 1,
      top: 5,
      halls: [{ floor: 1, x0: 0, x1: W - 1, height: 1 }],
      shafts: [1, 2, 3, 4].map((floor) => ({ kind: "stairs" as const, x: 11, bottom: floor, top: floor + 1 })),
      fill: { 2: OFFICES, 3: OFFICES, 4: OFFICES, 5: OFFICES },
    },
    {
      title: "Escalators",
      caption: "Escalators climb one floor each too, here up three floors of shops and fast food.",
      width: 36,
      bottom: 1,
      top: 4,
      halls: [{ floor: 1, x0: 0, x1: 35, height: 1 }],
      shafts: [1, 2, 3].map((floor) => ({ kind: "escalator" as const, x: 0, bottom: floor, top: floor + 1 })),
      fill: { 2: RETAIL, 3: RETAIL, 4: RETAIL },
    },
    {
      title: "Up a tall lobby",
      caption: "Out of a three-story lobby, the stairs spiral and the escalator switches back up the whole hall.",
      bottom: 1,
      top: 4,
      halls: [{ floor: 1, x0: 0, x1: W - 1, height: 3 }],
      shafts: [
        { kind: "stairs", x: 0, bottom: 1, top: 4 },
        { kind: "escalator", x: 22, bottom: 1, top: 4 },
      ],
      fill: { 4: OFFICES },
    },
    {
      title: "Beside a venue",
      caption: "Next to a two-story venue (Modern), a one-story stair spirals and an escalator turns back halfway.",
      width: 40,
      bottom: 2,
      top: 3,
      rooms: [{ kind: "partyHall", floor: 2, x: 0, occupants: 8 }],
      shafts: [
        { kind: "stairs", x: 24, bottom: 2, top: 3, winds: true },
        { kind: "escalator", x: 32, bottom: 2, top: 3, winds: true },
      ],
    },
  ];
  return drafts.map((d) => build(facts, d));
}

export function elevatorScenes(facts: Facts): Scene[] {
  const drafts: Draft[] = [
    {
      title: "Elevators",
      caption:
        "Standard, service and express shafts with their cars. The express passes floors 2 to 7 without a stop line.",
      bottom: 1,
      top: 8,
      halls: [{ floor: 1, x0: 0, x1: W - 1, height: 1 }],
      shafts: [
        {
          kind: "elevatorStandard",
          x: 1,
          bottom: 1,
          top: 8,
          cars: [
            { at: 1, riders: 3, dir: 1 },
            { at: 5.5, riders: 1, dir: -1 },
          ],
        },
        { kind: "elevatorService", x: 6, bottom: 1, top: 8, cars: [{ at: 4, riders: 0, dir: 0 }] },
        {
          kind: "elevatorExpress",
          x: 11,
          bottom: 1,
          top: 8,
          skip: [2, 3, 4, 5, 6, 7],
          cars: [{ at: 3.4, riders: 5, dir: 1 }],
        },
      ],
      fill: { 2: OFFICES, 3: OFFICES, 4: OFFICES, 5: HOTEL, 6: HOTEL, 7: HOTEL, 8: HOTEL },
    },
    {
      title: "Elevators at a sky lobby",
      caption:
        "The express runs up from the ground lobby to the sky lobby, and standard elevators carry people on from there.",
      bottom: 13,
      top: 17,
      halls: [{ floor: 15, x0: 0, x1: W - 1, height: 1 }],
      shafts: [
        {
          kind: "elevatorExpress",
          x: 1,
          bottom: 1,
          top: 15,
          skip: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
          cars: [{ at: 13.6, riders: 4, dir: 1 }],
        },
        { kind: "elevatorStandard", x: 19, bottom: 15, top: 22, cars: [{ at: 15, riders: 2, dir: 1 }] },
        { kind: "elevatorStandard", x: 24, bottom: 15, top: 22, cars: [{ at: 16.5, riders: 1, dir: -1 }] },
      ],
      fill: { 13: OFFICES, 14: OFFICES, 16: HOTEL, 17: HOTEL },
    },
  ];
  return drafts.map((d) => build(facts, d));
}
