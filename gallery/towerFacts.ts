/**
 * The render catalog the gallery's painters read: the Modern one, which holds
 * every kind and variety the art draws. Hand-written in the tests' fixture,
 * never a game's catalog.
 */
import { catalogFor } from "../src/tests/catalogFixture.js";
import type { FacilityKind, RenderCatalog, RenderFacility } from "../lib/render/renderModel.js";
import { bindViewWorld } from "../lib/presentation/viewWorld.js";
import { bindViewKinds } from "../lib/presentation/viewKinds.js";

/** The Modern render catalog, which holds every kind and variety the art
 *  draws, bound for the view the painters read. */
export function towerFacts(): { cat: RenderCatalog; facts: (kind: FacilityKind) => RenderFacility } {
  const cat = catalogFor("modern");
  bindViewWorld(cat.world);
  bindViewKinds(cat);
  const byKey = new Map(cat.facilities.map((f) => [f.key, f]));
  const facts = (kind: FacilityKind): RenderFacility => {
    const f = byKey.get(kind);
    if (!f) throw new Error(`The gallery's catalog has no ${kind}.`);
    return f;
  };
  return { cat, facts };
}
