import { afterEach, describe, expect, it } from "vitest";
import { isOperational, isPresent } from "@verticopolis/engine/model/unitState";
import { VIEW_ZOOM_MAX, VIEW_ZOOM_MIN } from "@verticopolis/engine/model/viewZoom";
import { catalogFor } from "../tests/catalogFixture";
import { towerRules, towerCatalog as sourceCatalog } from "../render/towerSource";
import { towerCatalog, useTowerCatalogSource } from "./towerCatalog";

describe("the deprecated catalog handle", () => {
  const sim = { mode: "classic" as const };
  afterEach(() => useTowerCatalogSource(sim, null));

  it("sets the tower's source with the engine's rules filled in", () => {
    const marked = { ...catalogFor("classic"), version: 0 };
    useTowerCatalogSource(sim, () => marked);
    expect(towerCatalog(sim)).toBe(marked);
    expect(sourceCatalog(sim)).toBe(marked);
    const rules = towerRules(sim);
    expect(rules.isPresent).toBe(isPresent);
    expect(rules.isOperational).toBe(isOperational);
    expect(rules.viewZoom).toEqual({ min: VIEW_ZOOM_MIN, max: VIEW_ZOOM_MAX });
  });
});
