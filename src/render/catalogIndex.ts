import type { FacilityKind, GameMode, RenderFacility } from "./renderModel";

/**
 * The renderer's lookups over a catalog: a facility by kind, and whether it
 * is open in an hour. The index is built once per catalog object.
 *
 * The lookups are generic over the facility type, so each caller gets back
 * the entry type its catalog holds: the renderer's `RenderCatalog` gives a
 * `RenderFacility`, and an engine `Catalog` (through the deprecated
 * `catalog/catalogTypes` path) gives the engine's full `CatalogFacility`.
 */

/** A catalog's facility list, whatever entry type it holds. */
export interface FacilityList<F extends { readonly key: FacilityKind }> {
  readonly mode: GameMode;
  readonly facilities: readonly F[];
}

const facilityIndex = new WeakMap<object, ReadonlyMap<FacilityKind, unknown>>();

/** The catalog entry for `kind`, or undefined when the catalog lists no such
 *  kind (a kind from another build, or a damaged save). */
export function findCatalogFacility<F extends { readonly key: FacilityKind }>(
  catalog: FacilityList<F>,
  kind: FacilityKind,
): F | undefined {
  let index = facilityIndex.get(catalog) as ReadonlyMap<FacilityKind, F> | undefined;
  if (!index) {
    index = new Map(catalog.facilities.map((f) => [f.key, f]));
    facilityIndex.set(catalog, index);
  }
  return index.get(kind);
}

/** The catalog entry for `kind`. Throws when the catalog lists no such kind,
 *  which only a damaged catalog or a kind from another build can cause. */
export function catalogFacility<F extends { readonly key: FacilityKind }>(
  catalog: FacilityList<F>,
  kind: FacilityKind,
): F {
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
