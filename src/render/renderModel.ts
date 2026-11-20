/**
 * What the renderer reads from a simulation, declared by the components and
 * by nothing else. The renderer, the scene modules and the presentation code
 * are typed by these shapes, so the compiler lists the read surface, and the
 * package imports no simulation type.
 *
 * A game can hand its simulation's own objects in with no copy when each shape
 * here is a subset of what its frame reader and catalog produce; the game
 * checks that on its own build (assignability plus a key check, so a member
 * its simulation drops or renames fails its typecheck).
 *
 * Function members are written as properties (`readonly f: (x) => T`), so
 * the compiler compares their parameters strictly. A member a simulation
 * always fills is required here; it is optional only where it may be left out
 * on some frames.
 */

// The vocabulary the renderer draws.

/** The facility kinds this package has art for. */
export type FacilityKind =
  | "lobby"
  | "floor"
  | "office"
  | "condo"
  | "rentalStudio"
  | "rentalApartment"
  | "hotelSingle"
  | "hotelDouble"
  | "hotelSuite"
  | "fastFood"
  | "restaurant"
  | "foodHall"
  | "shop"
  | "cinema"
  | "partyHall"
  | "amusements"
  | "boutiqueBay"
  | "fitnessClub"
  | "clinic"
  | "nightclub"
  | "spa"
  | "skyBar"
  | "aquaticCenter"
  | "daycare"
  | "stairs"
  | "escalator"
  | "elevatorStandard"
  | "elevatorService"
  | "elevatorExpress"
  | "parkingRamp"
  | "parking"
  | "security"
  | "medical"
  | "housekeeping"
  | "recycling"
  | "metro"
  | "weddingHall";

/** The unit states the renderer draws. */
export type UnitState =
  | "construction"
  | "empty"
  | "occupied"
  | "moving_in"
  | "vacating"
  | "asleep"
  | "dirty"
  | "infested"
  | "fire"
  | "gutted";

/** A walker's state in the drawn crowd. */
export type PersonState = "toShaft" | "waiting" | "riding" | "climbing" | "toDest" | "dwelling" | "done";

export type WeatherKind = "clear" | "cloudy" | "rain";
export type GameMode = "classic" | "modern";

/** The overview map's heatmap overlays. */
export type HeatmapMode = "congestion" | "occupancy" | "satisfaction" | "cleanliness";

/** The overview map's Eval tiers. */
export type EvalTier = "unrated" | "terrible" | "good" | "excellent";
/** The overview map's Pricing tiers. */
export type RentTier = "unpriced" | "noRate" | "veryLow" | "low" | "average" | "high";

/** The finance window's ledger rows. */
export type LedgerCat = "offices" | "condos" | "hotels" | "retail" | "food" | "entertainment" | "upkeep";

// The frame.

/** A room or a structure tile run the renderer draws. */
export interface RenderUnit {
  readonly id: number;
  readonly kind: FacilityKind;
  readonly floor: number;
  readonly x: number;
  readonly width: number;
  readonly state: UnitState;
  readonly subtype?: string;
  readonly occupants: number;
  readonly outForMeal?: number;
  readonly customersIn?: number;
}

/** A shaft: stairs, an escalator or an elevator with its cars. */
export interface RenderTransport {
  readonly id: number;
  readonly kind: FacilityKind;
  readonly x: number;
  readonly width: number;
  readonly bottom: number;
  readonly top: number;
  readonly cars: number;
  readonly skipFloors?: ReadonlyArray<number>;
  readonly carPositions: ReadonlyArray<number>;
  readonly carLoad?: ReadonlyArray<number>;
  readonly carDir: ReadonlyArray<number>;
}

/** A run of floor or lobby tiles, as the overview map draws it. */
export interface RenderStructureRun {
  readonly kind: "floor" | "lobby";
  readonly floor: number;
  readonly x: number;
  readonly width: number;
  readonly count: number;
}

/** A sky bridge (Modern). */
export interface RenderSkyBridge {
  readonly floor: number;
  readonly from: number;
  readonly to: number;
  readonly look: number;
}

/** One walker of the drawn crowd. */
export interface RenderPerson {
  readonly id: number;
  readonly staff?: boolean;
  readonly seed: number;
  readonly state: PersonState;
  readonly x: number;
  readonly floor: number;
  readonly fy: number;
  readonly wait: number;
}

/** One landing's waiting line: how many wait, and the worst wait tier. */
export interface RenderQueueLanding {
  readonly count: number;
  readonly tier: 0 | 1 | 2;
}

/** The waiting lines and the riders per car, by shaft id. */
export interface RenderQueue {
  readonly landings: ReadonlyMap<number, ReadonlyMap<number, RenderQueueLanding>>;
  readonly boarded: ReadonlyMap<number, ReadonlyMap<number, number>>;
}

/** The crowd the renderer draws, and its elevator queue projection. */
export interface RenderCrowd {
  readonly people: ReadonlyArray<RenderPerson>;
  /** Memoized by the simulation's reader; cheap per frame. */
  readonly queueView: () => RenderQueue;
}

/** A guard of a bomb search or a fire response. */
export interface RenderGuard {
  readonly floor: number;
  readonly left: number;
  readonly right: number;
  readonly from: number;
  readonly route: ReadonlyArray<readonly [number, number]>;
  readonly start: number;
  readonly arrive: number;
  readonly done: number;
}

/** Classic's bomb search while one runs. */
export interface RenderBombSearch {
  readonly deadline: number;
  readonly sweeping: readonly RenderGuard[];
  readonly lockdown: boolean;
}

/** The guards and the helicopter answering a fire. */
export interface RenderFireResponse {
  readonly floor: number;
  readonly x: number;
  readonly width: number;
  readonly guards: readonly RenderGuard[];
  readonly helicopter: {
    readonly called: number;
    readonly arrive: number;
    readonly sprayEnd: number;
    readonly leave: number;
  } | null;
  readonly seq: number;
}

/** One heatmap cell of the overview map. */
export interface RenderHeatCell {
  readonly floor: number;
  readonly minX: number;
  readonly maxX: number;
  readonly severity: number;
  readonly tint?: "infested" | "na";
}

/** A saved camera: the tile and floor it centers on, and its zoom. */
export interface RenderCamera {
  readonly tile: number;
  readonly floor: number;
  readonly zoom?: number;
}

/** The tower the renderer reads. */
export interface RenderTower {
  readonly units: ReadonlyArray<RenderUnit>;
  readonly transports: ReadonlyArray<RenderTransport>;
  readonly elevators?: ReadonlyArray<RenderTransport>;
  readonly revision: number;
  readonly mealOverlayRevision: number;
  readonly highestFloor: number;
  readonly lowestFloor: number;
  readonly getUnit: (id: number) => RenderUnit | undefined;
  readonly getTransport: (id: number) => RenderTransport | undefined;
  readonly unitAt: (floor: number, x: number) => RenderUnit | undefined;
  readonly hasStructure: (floor: number, x: number) => boolean;
  readonly structureKindAt: (floor: number, x: number) => "floor" | "lobby" | undefined;
  readonly skyBridges?: () => readonly RenderSkyBridge[];
  /** Working garage spaces by unit id. */
  readonly functionalParkingSet: () => ReadonlySet<number>;
  /** The simulation's lobby heights record (`lobbyHalls` reads it). Read once per
   *  structure pass, never per frame. */
  readonly lobbyHeights: () => ArrayLike<number>;
}

/** The clock reads the renderer makes. */
export interface RenderClock {
  /** The game clock in minutes since the start; it moves on every sim step. */
  readonly minutes: number;
  readonly hour: number;
  readonly minute: number;
  readonly minuteOfDay: number;
  readonly isMorning: () => boolean;
  readonly isEvening: () => boolean;
  readonly isNight: () => boolean;
}

/**
 * Everything the renderer reads from the simulation, and nothing else.
 *
 * Reads are grouped by how often they happen:
 *
 * - Per frame, cheap: `clock`, `tower.revision`, the effect counters, `weather`.
 * - Per frame, memoized by the simulation: `crowd.queueView`.
 * - Never per frame: `congestion`. Its answer moves with every step, so the
 *   simulation's memo misses on each running frame. Tests and tools read it.
 * - Per step or per HUD tick: `population`.
 * - Per scene sync or hourly: `floorHeatmap`, `peakCongestion`, `parkingUsage`,
 *   `recyclingFill`, `positionReachable`.
 * - Once per tower: `mode`, `rng.initialSeed`, `view`.
 */
export interface RenderSim {
  /** The tower's mode, which picks its catalog. */
  readonly mode: GameMode;
  /** The founding seed the scenery derives from; fixed for a tower's life. */
  readonly rng: { readonly initialSeed: number };
  /** The saved camera, read on construction and on `setSim`; null means no saved view. */
  readonly view: RenderCamera | null;
  readonly weather: WeatherKind;
  readonly population: number;
  readonly clock: RenderClock;
  readonly tower: RenderTower;
  readonly crowd: RenderCrowd;
  /** Effect counters: a change fires one visual. */
  readonly santaFxSeq: number;
  readonly vipFxSeq: number;
  readonly explosionFx: { readonly floor: number; readonly x: number; readonly seq: number };
  /** `x` is a tile of the stretch of floor the thief prowled. */
  readonly thiefFx: { readonly caught: boolean; readonly floor: number; readonly x: number; readonly seq: number };
  readonly treasureFx: { readonly floor: number; readonly x: number; readonly seq: number };
  /** Classic's bomb search while one runs, else null. */
  readonly bombSearch: RenderBombSearch | null;
  /** The guards and the helicopter answering a fire, else null. */
  readonly fireResponse: RenderFireResponse | null;
  readonly congestion: () => number;
  readonly peakCongestion: () => number;
  readonly floorHeatmap: (mode: HeatmapMode) => RenderHeatCell[];
  /** The garage fill for `spots` working spaces. */
  readonly parkingUsage: (spots: number) => number;
  readonly recyclingFill: () => number;
  /** Whether a walker can stand at `floor`, `x`. */
  readonly positionReachable: (floor: number, x: number) => boolean;
}

/** The overview map's Eval and Pricing rows: one per rated room. */
export interface RenderRoomTiers {
  readonly size: number;
  readonly id: (i: number) => number;
  readonly floor: (i: number) => number;
  readonly x: (i: number) => number;
  readonly evalTier: (i: number) => EvalTier;
  readonly rentTier: (i: number) => RentTier;
}

// The catalog.

/** A facility's effect on the rooms near it. */
export interface RenderHalo {
  readonly effect: "lift" | "drain";
  readonly floors: number;
}

/** A facility's noise: whether it carries or hears it, how far, and from which kinds. */
export interface RenderNoise {
  readonly role: "carries" | "hears";
  readonly tiles: number;
  readonly kinds: readonly FacilityKind[];
}

/** The catalog fields the renderer reads on a facility. */
export interface RenderFacility {
  readonly key: FacilityKind;
  readonly name: string;
  readonly width: number;
  readonly floors: number;
  readonly population: number;
  readonly maxHousehold: number | null;
  readonly attendance: number | null;
  readonly transport: boolean;
  readonly basement: boolean;
  readonly maxCars: number | null;
  readonly carCapacity: number | null;
  readonly subtypes: readonly string[] | null;
  readonly openHours: readonly boolean[] | null;
  readonly commercial: boolean;
  readonly hotel: boolean;
  readonly leaseAmenity: boolean;
  readonly unmetDemand: boolean;
  readonly halo: RenderHalo | null;
  readonly noise: readonly RenderNoise[];
}

/** The Metro train's timetable. */
export interface RenderMetroTrain {
  readonly firstHour: number;
  readonly lastHour: number;
  readonly legMinutes: number;
  readonly dwellMinutes: number;
  readonly runMinutes: number;
}

/** The world geometry the view is built for, from the catalog. */
export interface RenderWorld {
  readonly lotWidth: number;
  readonly minFloor: number;
  readonly maxFloor: number;
  readonly metroTrain: RenderMetroTrain;
}

/** The catalog fields the renderer reads. */
export interface RenderCatalog {
  readonly mode: GameMode;
  readonly world: RenderWorld;
  readonly economy: { readonly garbageCollectHour: number };
  readonly rules: {
    readonly decorativePassersBy: boolean;
    readonly shadedLook: boolean;
    readonly venueFlights: boolean;
    readonly frontDoorPerTower: boolean;
    readonly fedUpWait: number;
    readonly skyBridge: { readonly looks: readonly string[] } | null;
  };
  readonly facilities: readonly RenderFacility[];
}

/** The simulation's rules the renderer applies, built once by the app. */
export interface RenderRules {
  /** Whether a unit's tenants or guests are in it now. */
  readonly isPresent: (unit: { readonly state: UnitState }) => boolean;
  /** Whether a unit is built and running (not under construction, burned or gutted). */
  readonly isOperational: (unit: { readonly state: UnitState }) => boolean;
  /** The camera's zoom limits. */
  readonly viewZoom: { readonly min: number; readonly max: number };
}
