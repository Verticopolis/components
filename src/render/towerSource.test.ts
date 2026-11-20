import { describe, expect, it } from "vitest";
import { catalogFor } from "../tests/catalogFixture";
import { catalogFacility, findCatalogFacility } from "./catalogIndex";
import type { GameMode, RenderCatalog, RenderRules } from "./renderModel";
import { towerCatalog, towerRules, useTowerSource } from "./towerSource";

/** A tower as the handle reads it: a key with a mode. */
const tower = (mode: GameMode): { readonly mode: GameMode } => ({ mode });

const rules: RenderRules = {
  isPresent: () => true,
  isOperational: () => true,
  viewZoom: { min: 0.5, max: 4 },
};

describe("a tower's source (#921)", () => {
  it("reads the fallback source for the tower's own mode by default", () => {
    for (const mode of ["classic", "modern"] as const) {
      const sim = tower(mode);
      expect(towerCatalog(sim)).toEqual(catalogFor(mode));
      expect(towerCatalog(sim).mode).toBe(mode);
    }
  });

  it("reads each mode once and hands back the same catalog after", () => {
    const sim = tower("classic");
    expect(towerCatalog(sim)).toBe(towerCatalog(sim));
    expect(towerCatalog(sim, "modern")).toBe(towerCatalog(sim, "modern"));
    expect(towerCatalog(sim, "modern").mode).toBe("modern");
  });

  it("keeps each tower's catalog and rules apart", () => {
    const a = tower("classic");
    const b = tower("classic");
    useTowerSource(a, { catalog: () => ({ ...catalogFor("classic"), economy: { garbageCollectHour: 99 } }), rules });
    expect(towerCatalog(a).economy.garbageCollectHour).toBe(99);
    expect(towerRules(a)).toBe(rules);
    expect(towerCatalog(b)).toEqual(catalogFor("classic"));
    expect(towerRules(b)).not.toBe(rules);
  });

  it("switches to another source and back", () => {
    const sim = tower("modern");
    const asked: GameMode[] = [];
    const marked: RenderCatalog = { ...catalogFor("modern"), economy: { garbageCollectHour: 99 } };
    useTowerSource(sim, {
      catalog: (mode) => {
        asked.push(mode);
        return marked;
      },
      rules,
    });
    expect(towerCatalog(sim).economy.garbageCollectHour).toBe(99);
    expect(towerCatalog(sim).economy.garbageCollectHour).toBe(99);
    expect(asked).toEqual(["modern"]);
    useTowerSource(sim, null);
    expect(towerCatalog(sim)).toEqual(catalogFor("modern"));
  });

  it("finds a facility by kind, and refuses an unknown one only when asked to", () => {
    const catalog = catalogFor("classic");
    expect(catalogFacility(catalog, "office").key).toBe("office");
    expect(findCatalogFacility(catalog, "castle" as "office")).toBeUndefined();
    expect(() => catalogFacility(catalog, "castle" as "office")).toThrow(/lists no facility "castle"/);
  });
});
