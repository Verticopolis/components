import type { FacilityKind, GameMode, RenderCatalog, RenderFacility, RenderNoise } from "../render/renderModel";

/**
 * The render catalogs the tests, the gallery and the atlas bake draw with:
 * hand-written for the components, in the render model's shape. A game hands
 * the renderer its own catalog at run time; these hold only what the drawing
 * code reads (each kind's footprint, the people it holds, its varieties and
 * hours, its halo and noise), at the sizes the art is drawn for. The variety
 * names are the ones the sprites furnish (`render/pixelSprites/`).
 *
 * Classic has no halos, no noise and the plain rules; Modern adds them, so a
 * test can tell the two looks apart.
 */

/** A day's hours as 24 characters, `1` for open. */
const hours = (day: string): boolean[] => [...day].map((c) => c === "1");

const DAYTIME = hours("000000000011111111111000");
const MEALS = hours("000000000001110001111110");
const ALL_DAY = hours("000000011111111111111100");

interface Row {
  /** The display name, when it is not the key spelled out. */
  readonly name?: string;
  readonly width: number;
  readonly floors?: number;
  readonly population?: number;
  readonly maxHousehold?: number;
  readonly attendance?: number;
  readonly transport?: boolean;
  readonly basement?: boolean;
  readonly maxCars?: number;
  readonly carCapacity?: number;
  readonly subtypes?: readonly string[];
  readonly openHours?: readonly boolean[];
  readonly commercial?: boolean;
  readonly hotel?: boolean;
  readonly leaseAmenity?: boolean;
  readonly unmetDemand?: boolean;
}

const ROWS: Readonly<Record<FacilityKind, Row>> = {
  lobby: { width: 1 },
  floor: { width: 1 },
  office: { width: 9, population: 6, unmetDemand: true },
  condo: { name: "Condominium", width: 16, population: 3, maxHousehold: 5, unmetDemand: true },
  hotelSingle: { name: "Single Room", width: 4, population: 1, hotel: true, unmetDemand: true },
  hotelDouble: { name: "Twin Room", width: 6, population: 2, hotel: true, unmetDemand: true },
  hotelSuite: { name: "Suite", width: 10, population: 2, hotel: true, unmetDemand: true },
  fastFood: {
    width: 16,
    population: 25,
    commercial: true,
    openHours: ALL_DAY,
    subtypes: ["Japanese Soba", "Chinese Cafe", "Hamburger Stand", "Ice Cream", "Coffee Shop"],
  },
  restaurant: {
    width: 24,
    population: 35,
    commercial: true,
    openHours: MEALS,
    subtypes: ["English Pub", "French", "Chinese", "Sushi Bar", "Steak House"],
  },
  foodHall: {
    width: 24,
    population: 40,
    commercial: true,
    openHours: hours("000000000011111111111100"),
    subtypes: ["Ramen Bar", "Taco Stand", "Bubble Tea", "Poke Bowl", "Deli Counter", "Coffee Cart"],
  },
  shop: {
    name: "Retail Shop",
    width: 12,
    population: 20,
    commercial: true,
    openHours: DAYTIME,
    subtypes: [
      "Men's Clothing",
      "Pet Store",
      "Flower Shop",
      "Book Store",
      "Drug Store",
      "Boutique",
      "Electronics",
      "Bank",
      "Hair Salon",
      "Post Office",
      "Sports Gear",
    ],
  },
  cinema: { width: 31, floors: 2, attendance: 30, commercial: true, openHours: hours("000000000000111111111111") },
  partyHall: { width: 24, floors: 2, attendance: 20, openHours: hours("000000000000000001111111") },
  amusements: {
    width: 12,
    population: 25,
    commercial: true,
    openHours: hours("000000000011111111111111"),
    subtypes: ["Classic Arcade", "VR Lounge", "Claw Parlor", "Mini Golf"],
  },
  boutiqueBay: {
    width: 12,
    population: 22,
    commercial: true,
    openHours: DAYTIME,
    subtypes: ["Florist", "Barber", "Phone Repair", "Vintage", "Tattoo", "Record Store", "Gallery"],
  },
  fitnessClub: {
    width: 16,
    population: 20,
    leaseAmenity: true,
    subtypes: ["Weight Floor", "Yoga Studio", "Spin Studio", "Boxing Gym", "Climbing Wall"],
  },
  clinic: {
    width: 8,
    population: 12,
    leaseAmenity: true,
    subtypes: ["Dental", "Urgent Care", "Optometry", "Pharmacy", "Physio"],
  },
  nightclub: { width: 20, population: 30, commercial: true, openHours: hours("110000000000000000001111") },
  spa: { width: 14, population: 18, commercial: true, openHours: hours("000000000111111111111000") },
  skyBar: { width: 12, population: 22, commercial: true, openHours: hours("000000000000000011111111") },
  aquaticCenter: { width: 28, floors: 2, attendance: 24, openHours: hours("000000001111111111111100") },
  daycare: { width: 12, population: 14, commercial: true, openHours: hours("000000011111111111100000") },
  stairs: { name: "Stairway", width: 8, transport: true, carCapacity: 8 },
  escalator: { width: 8, transport: true, carCapacity: 30 },
  elevatorStandard: { name: "Standard Elevator", width: 4, transport: true, maxCars: 8, carCapacity: 21 },
  elevatorService: { name: "Service Elevator", width: 4, transport: true, maxCars: 8, carCapacity: 17 },
  elevatorExpress: { name: "Express Elevator", width: 6, transport: true, maxCars: 8, carCapacity: 42 },
  parkingRamp: { width: 16, basement: true },
  parking: { name: "Parking Space", width: 4, basement: true },
  security: { width: 16 },
  medical: { name: "Medical Center", width: 26 },
  housekeeping: { width: 15 },
  recycling: { name: "Recycling Center", width: 25, floors: 2, basement: true },
  metro: { name: "Metro Station", width: 30, floors: 3, basement: true },
  weddingHall: { width: 28, floors: 5, attendance: 12 },
  rentalStudio: { name: "Studio", width: 6, population: 1 },
  rentalApartment: { name: "Apartment", width: 11, population: 2, maxHousehold: 5, unmetDemand: true },
};

/** A display name from a kind's key, for the rows that name none: `partyHall` reads "Party Hall". */
const nameOf = (key: string): string => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const HOMES: readonly FacilityKind[] = [
  "condo",
  "hotelSingle",
  "hotelDouble",
  "hotelSuite",
  "rentalStudio",
  "rentalApartment",
];
const LOUD: readonly FacilityKind[] = [
  "fastFood",
  "restaurant",
  "foodHall",
  "shop",
  "cinema",
  "amusements",
  "boutiqueBay",
  "nightclub",
  "skyBar",
];

/** Modern's noise: loud rooms carry it to homes and offices, which hear it. */
function modernNoise(key: FacilityKind): RenderNoise[] {
  if (LOUD.includes(key)) {
    return [
      { role: "carries", tiles: 11, kinds: ["office"] },
      { role: "carries", tiles: 21, kinds: HOMES },
    ];
  }
  if (key === "office") {
    return [
      { role: "hears", tiles: 11, kinds: LOUD },
      { role: "carries", tiles: 21, kinds: HOMES },
    ];
  }
  if (HOMES.includes(key)) return [{ role: "hears", tiles: 21, kinds: ["office", ...LOUD] }];
  return [];
}

/** Modern's halos: amenities lift the homes near them and a nightclub drains them. */
const MODERN_HALOS: Partial<Record<FacilityKind, RenderFacility["halo"]>> = {
  partyHall: { effect: "lift", floors: 3 },
  fitnessClub: { effect: "lift", floors: 5 },
  nightclub: { effect: "drain", floors: 4 },
  spa: { effect: "lift", floors: 5 },
  aquaticCenter: { effect: "lift", floors: 6 },
  daycare: { effect: "lift", floors: 4 },
};

function facility(key: FacilityKind, row: Row, mode: GameMode): RenderFacility {
  return {
    key,
    name: row.name ?? nameOf(key),
    width: row.width,
    floors: row.floors ?? 1,
    population: row.population ?? 0,
    maxHousehold: row.maxHousehold ?? null,
    ownHousehold: mode === "modern" && row.maxHousehold !== undefined,
    attendance: row.attendance ?? null,
    transport: row.transport ?? false,
    basement: row.basement ?? false,
    maxCars: row.maxCars ?? null,
    carCapacity: row.carCapacity ?? null,
    subtypes: row.subtypes ?? null,
    openHours: row.openHours ?? null,
    commercial: row.commercial ?? false,
    hotel: row.hotel ?? false,
    leaseAmenity: row.leaseAmenity ?? false,
    unmetDemand: row.unmetDemand ?? false,
    halo: mode === "modern" ? (MODERN_HALOS[key] ?? null) : null,
    noise: mode === "modern" ? modernNoise(key) : [],
  };
}

function build(mode: GameMode): RenderCatalog {
  const modern = mode === "modern";
  return {
    mode,
    world: {
      lotWidth: 375,
      minFloor: -9,
      maxFloor: 100,
      metroTrain: { firstHour: 6, lastHour: 20, legMinutes: 6, dwellMinutes: 14, runMinutes: 54 },
    },
    economy: { garbageCollectHour: 5 },
    rules: {
      decorativePassersBy: modern,
      shadedLook: modern,
      venueFlights: modern,
      frontDoorPerTower: modern,
      fedUpWait: 25,
      skyBridge: modern ? { looks: ["Lobby", "Glass Skywalk", "Steel Truss", "Deco Arcade", "Garden Walk"] } : null,
    },
    facilities: (Object.keys(ROWS) as FacilityKind[]).map((key) => facility(key, ROWS[key], mode)),
  };
}

const CATALOGS: Readonly<Record<GameMode, RenderCatalog>> = { classic: build("classic"), modern: build("modern") };

/** `mode`'s render catalog. */
export function catalogFor(mode: GameMode): RenderCatalog {
  return CATALOGS[mode];
}
