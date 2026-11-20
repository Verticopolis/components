import type { Catalog } from "@verticopolis/engine/catalog/catalogTypes";
import { isOperational, isPresent } from "@verticopolis/engine/model/unitState";
import { VIEW_ZOOM_MAX, VIEW_ZOOM_MIN } from "@verticopolis/engine/model/viewZoom";
import type { GameMode, RenderRules } from "../render/renderModel";
import { catalogOn as sourceCatalogOn, useFallbackSource, useTowerSource } from "../render/towerSource";

/**
 * @deprecated The per-tower handle moved to `render/towerSource`, which takes
 * a render catalog and the engine's rules (`useTowerSource`). These wrappers
 * keep the old calls working with the engine's own rules filled in, for a
 * frontend that has not switched yet. They go in components 1.0.
 *
 * The catalogs a wrapper hands back are the objects its caller's source
 * returned, which are the engine's, so the cast back to `Catalog` holds.
 */

type Source = (mode: GameMode) => Catalog;

/** The engine's rules, as a frontend builds them (`engineRender.ts`). */
const ENGINE_RULES: RenderRules = {
  isPresent,
  isOperational,
  viewZoom: { min: VIEW_ZOOM_MIN, max: VIEW_ZOOM_MAX },
};

/** @deprecated Use `towerCatalog` from `render/towerSource`. */
export function towerCatalog(tower: { readonly mode: GameMode }, mode: GameMode = tower.mode): Catalog {
  return catalogOn(tower, mode);
}

/** @deprecated Use `catalogOn` from `render/towerSource`. */
export function catalogOn(key: object, mode: GameMode): Catalog {
  return sourceCatalogOn(key, mode) as Catalog;
}

/** @deprecated Use `useTowerSource(tower, { catalog, rules })`. */
export function useTowerCatalogSource(tower: object, source: Source | null): void {
  useTowerSource(tower, source && { catalog: source, rules: ENGINE_RULES });
}

/** @deprecated Use `useFallbackSource({ catalog, rules })`. */
export function useFallbackCatalogSource(source: Source | null): void {
  useFallbackSource(source && { catalog: source, rules: ENGINE_RULES });
}
