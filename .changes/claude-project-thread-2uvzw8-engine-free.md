---
package: major
---
- the package depends on no simulation. The deprecated subpaths that
  re-exported `@verticopolis/engine` are gone: `catalog/*`, `binding/*`,
  `port/*`, `host/*`, `events/*` and `fixtures/*`, and `model/types`,
  `model/engineTypes`, `model/unitState`, `model/viewZoom`,
  `model/floorRuns` and `model/serializedGame`. Import those from
  `@verticopolis/engine` itself. The engine is no longer a peer dependency.
- `presentation/catalogCheck`'s errors name the catalog by its mode ("the
  classic catalog"), without the engine.
- `npm run atlas` takes `--catalog <file>` to bake against a game's own
  Modern render catalog; without it the bake uses the components' own.
- `ui/uiModal`'s `ModalDeps.engineStopped()` is now `gameStopped()`: a modal
  still never opens over a game-failure message. Rename the member where the
  game passes its deps.
- The sprite atlas manifest's notes say "the simulation" where they said
  "the engine". No frame, field or schema version changes.
