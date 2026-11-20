import type { FacilityKind, RenderCatalog, RenderFacility } from "./renderModel";

/**
 * The renderer's lookups over a catalog: a facility by kind, and whether it
 * is open in an hour. The index is built once per catalog object.
 */

const facilityIndex = new WeakMap<RenderCatalog, ReadonlyMap<FacilityKind, RenderFacility>>();

/** The catalog entry for `kind`, or undefined when the catalog lists no such
 *  kind (a kind from another build, or a damaged save). */
export function findCatalogFacility(catalog: RenderCatalog, kind: FacilityKind): RenderFacility | undefined {
  let index = facilityIndex.get(catalog);
  if (!index) {
    index = new Map(catalog.facilities.map((f) => [f.key, f]));
    facilityIndex.set(catalog, index);
  }
  return index.get(kind);
}

/** The catalog entry for `kind`. Throws when the catalog lists no such kind,
 *  which only a damaged catalog or a kind from another build can cause. */
export function catalogFacility(catalog: RenderCatalog, kind: FacilityKind): RenderFacility {
  const f = findCatalogFacility(catalog, kind);
  if (!f) throw new Error(`the ${catalog.mode} catalog lists no facility "${kind}"`);
  return f;
}

/** Whether a facility is open in `hour` (the game hour; fractions and 24 read
 *  as the engines read them, since every opening and closing is on the hour):
 *  always, for a kind that keeps no business hours. */
export function catalogOpenAt(f: Pick<RenderFacility, "openHours">, hour: number): boolean {
  return f.openHours === null || f.openHours[((Math.floor(hour) % 24) + 24) % 24] === true;
}
