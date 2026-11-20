---
package: major
---
- the renderer, presentation, UI and audio import nothing from the engine
  (engine#89). `render/renderModel` declares what they read (`RenderSim`,
  `RenderTower`, `RenderCatalog`, `RenderRules` and the frame shapes), and a
  game fills it from the engine's frame reader and catalog with no copy.
  `render/towerSource` replaces the per-tower catalog handle:
  `useTowerSource(tower, { catalog, rules })` sets a tower's catalog and the
  engine's rules (`isPresent`, `isOperational`, the zoom limits), and
  `useFallbackSource` the one a hand-built tower reads.
  `render/catalogIndex` holds `findCatalogFacility`, `catalogFacility` and
  `catalogOpenAt` over a `RenderCatalog`.
- `TowerEngine` takes no view reader: it reads the camera, the clock and the
  tower from its `RenderSim`. Its zoom limits come from the tower's rules, so
  `towerInputCamera` no longer exports `MIN_ZOOM` and `MAX_ZOOM`.
  `RenderTower.tallLobbies()` is now `lobbyHeights()`, the engine's raw
  heights, and the renderer works out the halls itself. `shadesRoom` takes the
  rules' `isPresent`.
- `presentation/clockOf` takes the header's date fields and the engine's
  clock (`clockOf(header, sim.clock)`) and reads them once.
  `presentation/catalogCheck` is the boot check a game hands the engine as
  `checkCatalogs`.
- the engine's own code is gone from this package. `catalog/*`, `binding/*`,
  `port/*`, `host/*`, `events/*` and the engine's `model/*` modules now
  re-export `@verticopolis/engine` (1.60.0 or later) under their old paths and
  go in 1.0; `catalog/towerCatalog`, `port/headerClock`,
  `port/portRenderSim` and `host/catalogCheck` wrap or alias their new homes.
  The engine becomes an optional peer, and `fixtures/*` serves the installed
  engine's fixtures.
