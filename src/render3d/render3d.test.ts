import type { FacilityKind, RenderPerson, RenderTransport, RenderUnit } from "../render/renderModel";
import { kindFacts, kindKeys } from "../tests/catalogKinds";
import { testRules } from "../tests/renderRules";
import { BandArt } from "./bandArt";
import { paintSplit, type SplitTargets } from "./bandLayers";
import { bandOf, BAND_FLOORS, buildBand, STORY, uncovered, type BandInput } from "./bandGeometry";
import { BoxWriter, FACE } from "./boxWriter";
import { clampOrbit, farPlane, homeOrbit, orbitPosition, type OrbitLimits } from "./camera3d";
import { changedBands, joinRuns, towerBands } from "./floorDigest";
import { CONSTRUCTION, GUTTED, lookFor, LOOKS_3D } from "./looks3d";
import { sample } from "./movers3d";
import { FrameClock, startTier, stepDown } from "./quality";
import { resolveTime, timeOfDayAt } from "./sky3d";

function unit(kind: FacilityKind, over: Partial<RenderUnit> = {}): RenderUnit {
  return { id: 1, kind, floor: 3, x: 10, width: kindFacts(kind).width, state: "occupied", occupants: 1, ...over };
}

const oneStory = (): number => 1;

function band(units: RenderUnit[], over: Partial<BandInput> = {}): BandInput {
  return {
    band: 0,
    units,
    transports: [],
    bridges: [],
    rows: new Map(),
    stories: oneStory,
    isPresent: testRules.isPresent,
    ...over,
  };
}

describe("looks3d", () => {
  it("gives every catalog kind a look of its own", () => {
    for (const kind of kindKeys()) expect(LOOKS_3D[kind], kind).toBeDefined();
  });

  it("keeps every piece of furniture inside its room at every width a kind is built", () => {
    for (const kind of kindKeys()) {
      const w = kindFacts(kind).width;
      for (const p of LOOKS_3D[kind].furnish(w, 7)) {
        expect(p.w, kind).toBeGreaterThan(0);
        expect(p.x, kind).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w, kind).toBeLessThanOrEqual(w + 1e-9);
        expect(p.z0, kind).toBeLessThan(p.z1);
      }
    }
  });

  it("draws construction and gutted rooms in their own looks whatever the kind", () => {
    expect(lookFor("office", "construction")).toBe(CONSTRUCTION);
    expect(lookFor("condo", "gutted")).toBe(GUTTED);
    expect(lookFor("condo", "occupied")).toBe(LOOKS_3D.condo);
  });
});

describe("BoxWriter", () => {
  it("writes 24 vertices and 36 indices a box, less the skipped faces", () => {
    const w = new BoxWriter(1);
    w.box(0, 0, 0, 1, 1, 1, [255, 0, 0]);
    w.box(0, 0, 0, 1, 1, 1, [0, 255, 0], FACE.back | FACE.bottom);
    const g = w.geometry()!;
    expect(g.getAttribute("position").count).toBe(24 + 16);
    expect(g.getIndex()!.count).toBe(36 + 24);
    expect(g.getAttribute("color").getX(0)).toBe(1);
  });

  it("writes nothing for an empty box", () => {
    const w = new BoxWriter();
    w.box(0, 0, 0, 0, 1, 1, [0, 0, 0]);
    expect(w.geometry()).toBeNull();
  });
});

describe("buildBand", () => {
  it("lights a room at night only while its people are in, and always on fire", () => {
    const lit = (state: RenderUnit["state"]) =>
      buildBand(band([unit("office", { state })])).glow?.getAttribute("position").count ?? 0;
    expect(lit("occupied")).toBeGreaterThan(0);
    expect(lit("empty")).toBe(0);
    expect(lit("fire")).toBeGreaterThan(0);
  });

  it("gives a plain floor tile no furniture and no light", () => {
    const floor = buildBand(band([unit("floor", { width: 20 })]));
    const office = buildBand(band([unit("office")]));
    expect(floor.glow).toBeNull();
    expect(floor.faces).toBeLessThan(office.faces);
  });

  it("draws only the floors of a shaft that fall in the band", () => {
    const shaft: RenderTransport = {
      id: 5,
      kind: "elevatorStandard",
      x: 2,
      width: 4,
      bottom: 1,
      top: 30,
      cars: 1,
      carPositions: [3],
      carDir: [0],
    };
    const g = buildBand(band([], { band: 1, transports: [shaft] })).solid!;
    g.computeBoundingBox();
    expect(g.boundingBox!.min.y).toBeLessThan(BAND_FLOORS * STORY);
    expect(g.boundingBox!.max.y).toBeLessThanOrEqual(2 * BAND_FLOORS * STORY);
  });

  it("puts a roof only where the story above is open sky", () => {
    expect(uncovered({ min: 0, max: 20 }, [{ min: 5, max: 10 }])).toEqual([
      { min: 0, max: 5 },
      { min: 10, max: 20 },
    ]);
    expect(uncovered({ min: 0, max: 20 }, [{ min: -5, max: 30 }])).toEqual([]);
  });
});

describe("towerBands", () => {
  const tower = (units: RenderUnit[]) => ({ units, transports: [] });

  it("files units by their base floor's band, basements in negative bands", () => {
    expect(bandOf(0)).toBe(0);
    expect(bandOf(-1)).toBe(-1);
    const t = towerBands(tower([unit("office", { floor: 2 }), unit("parking", { id: 2, floor: -3 })]), oneStory);
    expect(t.units.get(0)?.length).toBe(1);
    expect(t.units.get(-1)?.length).toBe(1);
    expect([t.low, t.high]).toEqual([-1, 0]);
  });

  it("marks only the band whose room changed", () => {
    const a = [unit("office", { floor: 2 }), unit("office", { id: 2, floor: 20 })];
    const before = towerBands(tower(a), oneStory);
    const after = towerBands(tower([a[0]!, { ...a[1]!, state: "fire" }]), oneStory);
    expect(changedBands(before, after)).toEqual([bandOf(20)]);
    expect(changedBands(null, after).sort()).toEqual([0, bandOf(20)].sort());
  });

  it("marks the band a tall room's upper stories reach", () => {
    const tall = (stories: number) => towerBands(tower([unit("cinema", { floor: 7 })]), () => stories);
    expect(changedBands(tall(1), tall(2))).toEqual([0, 1]);
  });

  it("joins touching spans into one run", () => {
    expect(
      joinRuns([
        { min: 10, max: 20 },
        { min: 0, max: 10 },
        { min: 25, max: 30 },
      ]),
    ).toEqual([
      { min: 0, max: 20 },
      { min: 25, max: 30 },
    ]);
  });
});

describe("camera3d", () => {
  const limits: OrbitLimits = { minX: 0, maxX: 100, minY: -20, maxY: 200, minRadius: 20, maxRadius: 800, floorY: -19 };

  it("never looks from behind the back wall", () => {
    const o = clampOrbit({ tx: 50, ty: 50, tz: 0, theta: 3, phi: 1.2, radius: 100 }, limits);
    expect(orbitPosition(o)[2]).toBeGreaterThan(0);
  });

  it("keeps the camera above the bottom of the ground cut", () => {
    const o = clampOrbit({ tx: 50, ty: -10, tz: 0, theta: 0, phi: 1.7, radius: 300 }, limits);
    expect(orbitPosition(o)[1]).toBeGreaterThanOrEqual(limits.floorY - 1e-6);
  });

  it("keeps the whole scene inside the far plane from the opening view, even on a phone held upright", () => {
    const wide: OrbitLimits = { ...limits, maxX: 600, maxRadius: 10_000 };
    const home = homeOrbit(wide, 32, 0.5);
    const [x, y, z] = orbitPosition(home);
    // The far corner of the lot's surroundings, behind the tower and off to the side.
    const corner = Math.hypot(x - (wide.maxX + 160), y - wide.minY, z + 100);
    expect(farPlane(home, wide)).toBeGreaterThan(corner);
  });

  it("frames the built rooms, not the empty lot around them", () => {
    const built = { minX: 10, maxX: 40, minY: 0, maxY: 60 };
    const home = homeOrbit({ ...limits, maxX: 600 }, 32, 0.5, built);
    expect(home.tx).toBe(25);
    expect(home.radius).toBeLessThan(homeOrbit({ ...limits, maxX: 600 }, 32, 0.5).radius);
  });

  it("keeps zoom inside its limits", () => {
    expect(clampOrbit({ tx: 0, ty: 0, tz: 0, theta: 0, phi: 1, radius: 1 }, limits).radius).toBe(20);
  });
});

describe("quality", () => {
  it("starts phones low, tablets medium and computers high", () => {
    expect(startTier({ coarsePointer: true, shortSide: 400, cores: 8 })).toBe("low");
    expect(startTier({ coarsePointer: true, shortSide: 800, cores: 8 })).toBe("medium");
    expect(startTier({ coarsePointer: false, shortSide: 1080, cores: 8 })).toBe("high");
    expect(stepDown("low")).toBe("low");
  });

  it("steps down after two seconds of long frames, not on one slow frame", () => {
    const c = new FrameClock();
    let t = 0;
    let stepped = false;
    for (let i = 0; i < 60; i++) stepped ||= c.record(i === 30 ? 80 : 16, (t += 16));
    expect(stepped).toBe(false);
    for (let i = 0; i < 200 && !stepped; i++) stepped = c.record(30, (t += 30));
    expect(stepped).toBe(true);
  });
});

describe("crowd sampling", () => {
  const person = (id: number, fy: number, state: RenderPerson["state"] = "toDest"): RenderPerson => ({
    id,
    seed: id,
    state,
    x: 0,
    floor: Math.round(fy),
    fy,
    wait: 0,
  });

  it("keeps the people nearest the focus floor when over the cap, and skips riders", () => {
    const people = [person(0, 40), person(1, 2), person(2, 10, "riding"), person(3, 5)];
    expect(sample(people, 2, 3)).toEqual([1, 3]);
    expect(sample(people, 10, 3)).toEqual([0, 1, 3]);
  });
});

describe("sky3d", () => {
  it("follows the clock unless a time is pinned", () => {
    expect(timeOfDayAt(12)).toBe("day");
    expect(timeOfDayAt(18)).toBe("dusk");
    expect(timeOfDayAt(23)).toBe("night");
    expect(resolveTime("follow", 2)).toBe("night");
    expect(resolveTime("day", 2)).toBe("day");
  });
});

describe("BandArt", () => {
  const unit = (id: number, kind: RenderUnit["kind"], floor: number, x: number, width: number): RenderUnit => ({
    id,
    kind,
    floor,
    x,
    width,
    state: "occupied",
    occupants: 0,
  });

  it("hangs each room's art on its back wall and carpets its floor, inside the band's canvas", () => {
    const art = new BandArt(0, 1);
    art.layout([unit(1, "office", 3, 10, 9), unit(2, "floor", 3, 19, 4), unit(3, "office", 9, 0, 9)], () => 1);
    const g = art.geometry!;
    // Two rooms in band 0 (the one on floor 9 is band 1's), two quads each.
    expect(g.index!.count).toBe(2 * 2 * 6);
    const uv = g.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) {
      expect(uv.getX(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getX(i)).toBeLessThanOrEqual(1);
      expect(uv.getY(i)).toBeGreaterThanOrEqual(0);
      expect(uv.getY(i)).toBeLessThanOrEqual(1);
    }
    g.computeBoundingBox();
    expect(g.boundingBox!.min.x).toBe(10);
    expect(g.boundingBox!.max.x).toBe(23);
    expect(art.canvas.width).toBe(13 * 10);
    // The furniture stands in front of the wall, one quad per room, on a canvas of the same size.
    const front = art.frontGeometry!;
    expect(front.index!.count).toBe(2 * 6);
    front.computeBoundingBox();
    expect(front.boundingBox!.min.z).toBeGreaterThan(g.boundingBox!.min.z + 1);
    expect(art.frontCanvas.width).toBe(art.canvas.width);
    art.dispose();
  });

  it("has nothing to hang for a band with no rooms", () => {
    const art = new BandArt(2, 1);
    art.layout([unit(1, "office", 3, 10, 9)], () => 1);
    expect(art.geometry).toBeNull();
  });
});

describe("paintSplit", () => {
  /** A 2D context that takes any call and records the clears and copies. */
  function fakeCtx(log: string[], name: string): CanvasRenderingContext2D {
    const target: Record<string, unknown> = {
      canvas: { name },
      globalCompositeOperation: "source-over",
      getTransform: () => ({}),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      measureText: () => ({ width: 4 }),
      clearRect: (x: number, y: number, w: number, h: number) => log.push(`${name} clear ${x},${y},${w},${h}`),
      drawImage: (src: { name: string }) => log.push(`${name} copy from ${src.name}`),
    };
    return new Proxy(target, {
      get: (t, k: string) => (k in t ? t[k] : () => {}),
      set: (t, k: string, v) => {
        t[k] = v;
        return true;
      },
    }) as unknown as CanvasRenderingContext2D;
  }

  const lobby: RenderUnit = { id: 1, kind: "lobby", floor: 1, x: 0, width: 3, state: "occupied", occupants: 0 };
  const floor: RenderUnit = { id: 2, kind: "floor", floor: 2, x: 0, width: 3, state: "occupied", occupants: 0 };
  const look = { lit: false, anim: 0, hour: 12, staffed: true };

  it("splits a lobby tile by tile: the shell put back after its furniture, the furniture cleared of wall", () => {
    const log: string[] = [];
    const t: SplitTargets = {
      shell: fakeCtx(log, "shell"),
      front: fakeCtx(log, "front"),
      aside: fakeCtx(log, "aside"),
      scale: 1,
    };
    paintSplit(t, look, lobby, 0, 0, 30, 45);
    for (const x of [0, 10, 20]) {
      // Each tile's wall is set aside at its break and copied back at its end.
      expect(log).toContain(`aside clear ${x},0,10,45`);
      expect(log).toContain(`shell clear ${x},0,10,45`);
      // Each tile's furniture starts from transparency at its break.
      expect(log).toContain(`front clear ${x},0,10,45`);
    }
    expect(log.filter((l) => l === "shell copy from aside")).toHaveLength(3);
  });

  it("leaves a room with no split all wall", () => {
    const log: string[] = [];
    const t: SplitTargets = {
      shell: fakeCtx(log, "shell"),
      front: fakeCtx(log, "front"),
      aside: fakeCtx(log, "aside"),
      scale: 2,
    };
    paintSplit(t, look, floor, 0, 0, 30, 45);
    expect(log).toEqual(["front clear 0,0,60,90"]);
  });
});
