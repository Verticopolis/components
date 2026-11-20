# Components changelog

Release notes for `@verticopolis/components`, one `## <version>` section per
package version, newest first, written for people who build on the package.
The player-facing notes live in the game's
[`CHANGELOG.md`](https://github.com/Verticopolis/web/blob/main/CHANGELOG.md),
and the engine's in
[`engine-rs/CHANGELOG.md`](https://github.com/Verticopolis/engine/blob/main/engine-rs/CHANGELOG.md).

A pull request that changes what the package ships adds its entries as a
change note under
[`.changes/`](https://github.com/Verticopolis/components/blob/main/.changes/README.md),
with the level it needs: **major** for a breaking change to an export or a
stylesheet's selectors, **minor** for a new export, component or look,
**patch** for a fix. A change to the repository alone (CI, the gallery, the
screenshot tests) needs no note. **Cut release** picks the version from
those levels and writes the notes into the version's section, each entry led
by its level, and **Release components** puts that section in the GitHub
release; it refuses a version with no section (README, "Releasing").

Entries up to 0.2.2 were written afterward from the history of the pull
requests that made each version.

## 1.0.0 (2026-11-20)

- **major**: the package depends on no simulation. The deprecated subpaths that
  re-exported `@verticopolis/engine` are gone: `catalog/*`, `binding/*`,
  `port/*`, `host/*`, `events/*` and `fixtures/*`, and `model/types`,
  `model/engineTypes`, `model/unitState`, `model/viewZoom`,
  `model/floorRuns` and `model/serializedGame`. Import those from
  `@verticopolis/engine` itself. The engine is no longer a peer dependency.
- **major**: `presentation/catalogCheck`'s errors name the catalog by its mode ("the
  classic catalog"), without the engine.
- **major**: `npm run atlas` takes `--catalog <file>` to bake against a game's own
  Modern render catalog; without it the bake uses the components' own.
- **major**: `ui/uiModal`'s `ModalDeps.engineStopped()` is now `gameStopped()`: a modal
  still never opens over a game-failure message. Rename the member where the
  game passes its deps.
- **major**: The sprite atlas manifest's notes say "the simulation" where they said
  "the engine". No frame, field or schema version changes.
- **major**: The `shared/*` subpath is gone. It was the old name of `model/*`, kept as
  an alias after the folder's rename: import
  `@verticopolis/components/model/*` instead (the files are the same).
- **major**: Semver now covers the stable subpaths: `windows/*`, `styles.css`,
  `styles/*`, `model/*`, `render/renderModel` and `render/towerSource`. The
  rest of `render/*` (the scene in `render/excalibur/*` included),
  `presentation/*` and `audio/*` are internal: a game may import them pinned
  to an exact version, but they can change in a minor version (README, "Use
  it").
- **patch**: On a portrait phone, the Getting Started card no longer covers the top
  bar's stat chips. It sits just under the bar (CSS anchor positioning), as
  it now does on a phone held sideways, with a measured top for each width
  tier in a browser without anchoring. It used to sit at 58px, over all of
  the chips. On a short phone its step list scrolls instead of reaching the
  tool palette.

## 0.3.0 (2026-11-20)

- **major**: the renderer, presentation, UI and audio import nothing from the engine
  (engine#89). `render/renderModel` declares what they read (`RenderSim`,
  `RenderTower`, `RenderCatalog`, `RenderRules` and the frame shapes), and a
  game fills it from the engine's frame reader and catalog with no copy.
  `render/towerSource` replaces the per-tower catalog handle:
  `useTowerSource(tower, { catalog, rules })` sets a tower's catalog and the
  engine's rules (`isPresent`, `isOperational`, the zoom limits), and
  `useFallbackSource` the one a hand-built tower reads.
  `render/catalogIndex` holds `findCatalogFacility`, `catalogFacility` and
  `catalogOpenAt` over a `RenderCatalog`.
- **major**: `TowerEngine` takes no view reader: it reads the camera, the clock and the
  tower from its `RenderSim`. Its zoom limits come from the tower's rules, so
  `towerInputCamera` no longer exports `MIN_ZOOM` and `MAX_ZOOM`.
  `RenderTower.tallLobbies()` is now `lobbyHeights()`, the engine's raw
  heights, and the renderer works out the halls itself. `shadesRoom` takes the
  rules' `isPresent`.
- **major**: `presentation/clockOf` takes the header's date fields and the engine's
  clock (`clockOf(header, sim.clock)`) and reads them once.
  `presentation/catalogCheck` is the boot check a game hands the engine as
  `checkCatalogs`.
- **major**: the engine's own code is gone from this package. `catalog/*`, `binding/*`,
  `port/*`, `host/*`, `events/*` and the engine's `model/*` modules now
  re-export `@verticopolis/engine` (1.60.0 or later) under their old paths and
  go in 1.0; `catalog/towerCatalog`, `port/headerClock`,
  `port/portRenderSim` and `host/catalogCheck` wrap or alias their new homes.
  The engine becomes an optional peer, and `fixtures/*` serves the installed
  engine's fixtures.
- **major**: every stylesheet puts its rules in a cascade layer under `vc`
  (`@layer vc.tokens, vc.base, vc.components, vc.page;`), and each
  component's sheet in its own layer inside `vc.components`. A page's own
  unlayered CSS now beats every components rule whatever its specificity and
  wherever the bundler puts it; a `!important` inside a `vc` layer beats an
  unlayered one. A page that layers its own CSS orders it against `vc`
  (README, "Cascade layers"). The game's stylesheet keeps every rule's
  winner, so the game draws the same. On a page that loads `retro-page.css`
  in a dark OS theme, the dark teal ground now applies only when no color
  scheme is set (`html[data-scheme]`), so Skyline and High Contrast keep their
  own ground; the components gallery, which never showed the dark ground
  before, now shows it in Standard, as the game's own standalone pages do.
- **major**: the window modules import their own stylesheet: `windows/menuBar` imports
  `styles/menu-bar.css`, and `windows/uiModal` and `windows/movableWindow`
  (so `windows/desk/deskWindow` too) import `styles/window.css`. A page that
  uses only those modules no longer needs a stylesheet import for them. They
  now need a bundler that loads CSS imported from JavaScript (Vite does);
  plain Node can no longer import them. Their declarations do not carry the
  CSS imports.
- **major**: a Starlight site declares `@layer starlight, vc;` through Starlight's `head`
  option rather than a first `customCss` entry: Astro puts the menu bar's CSS,
  which the `windows/menuBar` module now imports, ahead of `customCss`.
- **minor**: `styles/starlight.css` dresses a Starlight docs site in the game's look:
  the tokens, `styles/starlight-theme.css` (the How to Play window's title
  bar, sidebar and reading well, and the title screen for a page with a hero)
  and `styles/title-bar.css` (the docs title bar's `.vc-bar` markup). These
  are the stylesheets the engine docs and the help site each kept a copy of.
  Both new sheets sit in `vc.page`; a Starlight site loads a file holding
  `@layer starlight, vc;` first (README, "Styles").
- **minor**: `src/shared/` is now `src/model/`, exported as `model/*`: the
  tower model types and the small helpers over them. `shared/*` stays as an
  alias for the same files until 1.0, so existing imports keep working; move
  them to `model/*`.
- **patch**: the declarations resolve under `nodenext`. Every relative import in the
  shipped `.d.ts` files now names its `.js` file (or `/index.js`), so a
  project that resolves modules the way Node does follows them instead of
  failing, or reading every imported type as `any` with `skipLibCheck` on.
  The packed package's `engines` is `node >=22` in place of `26.x`, so an
  install on Node 22 or 24 no longer warns; the package runs on both. The
  repository's own tooling stays on Node 26.
- **patch**: the renderer's context-loss handler stops the Excalibur engine
  with its public `stop()`, which also stops the texture collector and pauses
  the browser listeners, instead of stopping only the clock. The rebuild's
  teardown (`render/excalibur/engineTeardown`) still stops the collector for
  a context lost while the screen saver held the frames, and a test against
  the real Excalibur now fails if an upgrade moves that private field.
- **patch**: On a phone held sideways, the Getting Started card no longer covers the top
  bar. Its top follows the bar's bottom edge (CSS anchor positioning), so it
  clears the bar however many lines the bar wraps to. A browser without
  anchoring uses a top measured for each width tier. The card used to sit
  21px over the stat chips from 540 to 819px wide.

## 0.2.2 (2026-11-19)

- **patch**: the shared chrome is split into one stylesheet per component
  (`styles/button.css`, `styles/window.css`, `styles/well.css`,
  `styles/kv.css`). Each imports what it needs, so a page can import one
  piece on its own. `styles/retro-components.css` imports them in the old
  order, and `styles/menu-bar.css` and the overview map stylesheets import
  their own prerequisites, so a page that imports what it did before gets the
  same CSS.
- **patch**: `styles/retro-page.css` no longer draws a menu bar's `kbd`
  shortcuts as keycaps when the menu bar sits inside a window body. The game
  does not load `retro-page.css`.

## 0.2.1 (2026-11-19)

- No change to the package. The sprite atlas workflow runs from the tag it is
  dispatched on and installs the engine from npm.

## 0.2.0 (2026-11-19)

- **minor**: the package ships compiled JavaScript. `npm run build` compiles
  `src/` into `lib/`, one ES module per source module with source maps and
  `.d.ts` files, comments kept (the pixelarticons MIT notice included). Every
  subpath export points at `lib/`, and the tarball holds `lib/` and no
  sources, so Node and bundlers load it from `node_modules`. Bare imports stay
  external, `import.meta.env` is left for the game's bundler, and
  `sideEffects` stays CSS only.
- Released from a workflow: the GitHub release carries the tarball and its
  SHA-256 checksum, and npm gets that same tarball through trusted publishing,
  with provenance.

## 0.1.0 (2026-11-19)

- **minor**: the first release of the components extracted from the game's
  repository: the renderer and Excalibur scene, the Win95 windows and menus,
  the procedural sprites and audio, the engine binding and port, and the
  WebAssembly host loader, as subpath exports (`render/*`, `windows/*`,
  `audio/*`, `binding/*`, `port/*`, `host/*`, `presentation/*`, `catalog/*`,
  `events/*`, `shared/*`, `styles/*`, `styles.css`). Peers:
  `@verticopolis/engine` `^1.57.1`, `excalibur`, `tone` and `lit-html`.
