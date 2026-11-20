import { describe, expect, expectTypeOf, it } from "vitest";
import { catalogFor } from "../tests/catalogFixture";
import type { RenderCatalog, RenderFacility } from "../render/renderModel";
import { catalogFacility, findCatalogFacility, type Catalog, type CatalogFacility } from "./catalogTypes";

/**
 * The deprecated `catalog/catalogTypes` path keeps old calls working: a lookup
 * in an engine `Catalog` hands back the engine's full `CatalogFacility` (its
 * prices and rents included), while the renderer's `RenderCatalog` gets a
 * `RenderFacility`. Both read the one index over the same catalog object.
 */
describe("the catalog lookups on the deprecated path", () => {
  const catalog: Catalog = catalogFor("classic");

  it("hand back the engine's own entry, with what the engine's catalog carries", () => {
    const office = catalogFacility(catalog, "office");
    expectTypeOf(office).toEqualTypeOf<CatalogFacility>();
    expect(office).toBe(catalog.facilities.find((f) => f.key === "office"));
    expect(office.cost).toBeGreaterThan(0);
    expect(findCatalogFacility(catalog, "office")?.rent).toEqual(office.rent);
  });

  it("hand the renderer its render entry, from the same index", () => {
    const render: RenderCatalog = catalog;
    const office = catalogFacility(render, "office");
    expectTypeOf(office).toEqualTypeOf<RenderFacility>();
    expect(office).toBe(catalogFacility(catalog, "office"));
  });

  it("find nothing for a kind the catalog does not list, and refuse it when asked to", () => {
    const empty: Catalog = { ...catalog, facilities: [] };
    expect(findCatalogFacility(empty, "office")).toBeUndefined();
    expect(() => catalogFacility(empty, "office")).toThrow('the classic catalog lists no facility "office"');
  });
});
