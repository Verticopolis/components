/**
 * Splits a tower into bands for {@link buildBand} and fingerprints each band,
 * so a change to the tower rebuilds only the bands whose rooms, shafts or
 * bridges changed. One pass over the units and the transports per tower
 * revision; never per frame.
 */
import type { RenderSkyBridge, RenderTower, RenderTransport, RenderUnit } from "../render/renderModel";
import { bandOf, BAND_FLOORS, type Run } from "./bandGeometry";

/** A tower split into bands, with a fingerprint per band. */
export interface TowerBands {
  readonly units: ReadonlyMap<number, RenderUnit[]>;
  readonly transports: ReadonlyMap<number, RenderTransport[]>;
  readonly bridges: ReadonlyMap<number, RenderSkyBridge[]>;
  readonly rows: ReadonlyMap<number, Run[]>;
  readonly digests: ReadonlyMap<number, number>;
  /** The lowest and highest band that holds anything. */
  readonly low: number;
  readonly high: number;
}

const STATES = [
  "construction",
  "empty",
  "occupied",
  "moving_in",
  "vacating",
  "asleep",
  "dirty",
  "infested",
  "fire",
  "gutted",
];

function mix(h: number, v: number): number {
  return Math.imul(h ^ (v | 0), 16777619) >>> 0;
}

function mixText(h: number, s: string): number {
  for (let i = 0; i < s.length; i++) h = mix(h, s.charCodeAt(i));
  return h;
}

function push<T>(m: Map<number, T[]>, k: number, v: T): void {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
}

/** Splits `tower` into bands. `stories` is a unit's height in stories. */
export function towerBands(
  tower: Pick<RenderTower, "units" | "transports" | "skyBridges">,
  stories: (u: RenderUnit) => number,
): TowerBands {
  const units = new Map<number, RenderUnit[]>();
  const transports = new Map<number, RenderTransport[]>();
  const bridges = new Map<number, RenderSkyBridge[]>();
  const spans = new Map<number, Run[]>();
  const digests = new Map<number, number>();
  const touch = (band: number, h: (d: number) => number): void => {
    digests.set(band, h(digests.get(band) ?? 2166136261));
  };
  for (const u of tower.units) {
    const band = bandOf(u.floor);
    push(units, band, u);
    const tall = Math.max(1, stories(u));
    touch(band, (d) =>
      mix(mix(mix(mix(mix(mixText(d, u.kind), u.id), u.x), u.width), u.floor * 64 + tall), STATES.indexOf(u.state)),
    );
    for (let f = u.floor; f < u.floor + tall; f++) {
      push(spans, f, { min: u.x, max: u.x + u.width });
      // A tall room's upper stories shape the side walls of the band they reach.
      if (bandOf(f) !== band) touch(bandOf(f), (d) => mix(mix(d, u.id), f));
    }
  }
  for (const t of tower.transports) {
    for (let band = bandOf(t.bottom); band <= bandOf(t.top); band++) {
      push(transports, band, t);
      touch(band, (d) => mix(mix(mix(mix(mixText(d, t.kind), t.id), t.x), t.bottom), t.top));
    }
  }
  for (const b of tower.skyBridges?.() ?? []) {
    const band = bandOf(b.floor);
    push(bridges, band, b);
    touch(band, (d) => mix(mix(mix(d, b.floor), b.from), b.to));
  }
  const rows = new Map<number, Run[]>();
  for (const [f, list] of spans) rows.set(f, joinRuns(list));
  // A roof depends on the row above, so a band's fingerprint takes in the
  // first row of the band above it.
  for (const band of [...digests.keys()]) {
    for (const r of rows.get((band + 1) * BAND_FLOORS) ?? []) touch(band, (d) => mix(mix(d, r.min), r.max));
  }
  const bands = [...digests.keys()];
  return {
    units,
    transports,
    bridges,
    rows,
    digests,
    low: bands.length ? Math.min(...bands) : 0,
    high: bands.length ? Math.max(...bands) : 0,
  };
}

/** The bands whose fingerprint differs between `before` and `after`, either way. */
export function changedBands(before: TowerBands | null, after: TowerBands): number[] {
  if (!before) return [...after.digests.keys()];
  const out = new Set<number>();
  for (const [band, d] of after.digests) if (before.digests.get(band) !== d) out.add(band);
  for (const band of before.digests.keys()) if (!after.digests.has(band)) out.add(band);
  return [...out].sort((a, b) => a - b);
}

/** Spans joined into runs: spans that touch or overlap are one. */
export function joinRuns(spans: readonly Run[]): Run[] {
  const sorted = [...spans].sort((a, b) => a.min - b.min);
  const out: { min: number; max: number }[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.min <= last.max) last.max = Math.max(last.max, s.max);
    else out.push({ min: s.min, max: s.max });
  }
  return out;
}
