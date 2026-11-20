# Verticopolis components

The TypeScript pieces of [Verticopolis](https://verticopolis.com) that a
frontend builds on: the renderer and Excalibur scene, the Win95 windows and
menus, the procedural sprites and audio, the engine binding and port, and the
WebAssembly host loader. The web game is built from them, and so can any other
game that runs the Verticopolis engine.

## The Verticopolis repositories

| Repository | What it holds |
| --- | --- |
| [Verticopolis/engine](https://github.com/Verticopolis/engine) | The Rust simulation engine, its WebAssembly package and the conformance lock |
| **[Verticopolis/components](https://github.com/Verticopolis/components)** (this one) | The renderer, windows and menus, audio, the engine binding and host |
| [Verticopolis/web](https://github.com/Verticopolis/web) | The web game at [verticopolis.com](https://verticopolis.com) and its player's manual |

The game depends on the engine and the components, and the components load
the engine's WebAssembly package at run time.

## Use it

```sh
npm install @verticopolis/components @verticopolis/engine excalibur tone lit-html
```

The engine, Excalibur, Tone.js and lit-html are peer dependencies, so the
game installs its own copy of each beside the components.

The one direct dependency is fflate, which the sprite atlas bake
(`render/atlas/archive`, `render/atlas/png`) uses to write PNG and zip files.
No module a game draws with imports it, so a game that uses fflate itself
(the web game reads and writes saves with it) installs one copy for both. The
engine's WebAssembly does not use this copy: it carries its own Rust port of
fflate's level-1 deflate, so the engine writes `.vctower` bytes identical to
the web game's.

Each release on GitHub (tagged `v<version>`, or `components-v<version>` up
to 0.2.1) carries the same tarball npm serves, with its SHA-256 checksum,
so a download can be checked against the release. Versions published from
the release workflow also carry npm provenance.

The package ships compiled JavaScript (ES modules, one file per source
module, with `.d.ts` types and source maps). The types are written for a
bundler (`"moduleResolution": "bundler"` in a game's tsconfig). Only the CSS files count as side
effects, so a bundler drops every module a game does not import.

The version stays below 1.0 while every module is reachable as a subpath:
any subpath may change in a minor version, so pin a minor (`"@verticopolis/components": "~0.2.1"`). 1.0
waits for a curated public surface. Each folder is a subpath export:

| Import | Folder | What it is |
| --- | --- | --- |
| `@verticopolis/components/render/*` | `src/render/` | The Excalibur scene, the tower renderer and the procedural sprites |
| `@verticopolis/components/presentation/*` | `src/presentation/` | What the view shows for each kind of room |
| `@verticopolis/components/catalog/*` | `src/catalog/` | The engine catalog as the view reads it |
| `@verticopolis/components/model/*` | `src/model/` | The tower model types (`types`, `engineTypes`, `serializedGame`) and small helpers over them. `shared/*` is the same folder under its old name, kept until 1.0 |
| `@verticopolis/components/binding/*` | `src/engineBinding/` | The WebAssembly binding's types and export tiers |
| `@verticopolis/components/port/*` | `src/simport/` | The engine port a frontend talks to |
| `@verticopolis/components/host/*` | `src/wasmhost/` | Loading and checking the engine package |
| `@verticopolis/components/events/*` | `src/events/` | The gameplay events a host drains |
| `@verticopolis/components/audio/*` | `src/audio/` | The procedural music and ambience on Tone.js |
| `@verticopolis/components/windows/*` | `src/ui/` | The Win95 windows, menus and message boxes |
| `@verticopolis/components/styles.css` | `src/styles.css` | The styles the windows use |
| `@verticopolis/components/styles/*` | `src/styles/` | The stylesheets `styles.css` imports, one by one |
| `@verticopolis/components/fixtures/*` | `src/simport/fixtures/` | The engine-written JSON fixtures (catalogs, the view layout) for a game's unit tests |

For example, `import { MenuBar } from "@verticopolis/components/windows/menuBar"`.

Excalibur, Tone, lit-html and `@verticopolis/engine` are required peer
dependencies. npm 7 and later install them with the components; with
`--legacy-peer-deps` or a package manager that skips peers, a game without
the engine builds, and fails at run time when the host loads the engine's
WebAssembly. The components never import the engine's JavaScript: the host
(`host/*`) loads the engine's WebAssembly at run time from the URL the game
serves it at, and the binding (`binding/*`) is written against that engine's
API. So a game installs `@verticopolis/engine` itself, serves its `web/`
build, and keeps it in the version range this package names. A host defines four build
constants (`__APP_VERSION__`, `__APP_SHA__`, `__TOOLING_ENGINE__`,
`__ENGINE_PACKAGE__`), declared in `src/env.d.ts`; with Vite that is its
`define` option.

### Styles

The whole game look is one import, which pulls in the tokens, the shared
components, every piece, the game layers and both color schemes, in cascade
order:

```js
import "@verticopolis/components/styles.css";
```

A page that wants only some pieces imports them from one stylesheet of its
own. Each piece imports what it needs (the tokens, and a window's title-bar
button), so naming a piece is enough, and inside one stylesheet a bundler
inlines each file once, in the order of its first `@import`:

```css
/* page.css: import this file once, from JS or a <link> */
@import "@verticopolis/components/styles/button.css";       /* .btn and its looks */
@import "@verticopolis/components/styles/window.css";       /* .win, .win-title (with the button) */
@import "@verticopolis/components/styles/well.css";         /* .well, .field */
@import "@verticopolis/components/styles/kv.css";           /* .kv */
@import "@verticopolis/components/styles/menu-bar.css";     /* the Win95 menu bar */
@import "@verticopolis/components/styles/overview-map.css"; /* the overview map (with the window) */
@import "@verticopolis/components/styles/overview-map-views.css"; /* its View row (with the map) */
```

The window modules bring their own stylesheet. `windows/menuBar` imports
`menu-bar.css`, and `windows/uiModal` and `windows/movableWindow` (so
`windows/desk/deskWindow` too) import `window.css`, so a page that uses only
those modules needs no stylesheet import for them. That needs a bundler that
loads CSS imported from JavaScript, as Vite does: plain Node has no loader
for `.css` and cannot import those modules, while a test runner built on a
bundler (Vitest) can. Their declarations do not carry the CSS imports.

When a module and a page's stylesheet bring the same sheet, the bundle may
hold two copies of it. That changes nothing on screen: each piece sits in a
cascade layer of its own and the tokens in theirs (see "Cascade layers"), so
a copy cannot move one piece ahead of another, and a page's own rules, a
token override on `:root` included, beat every copy. Importing the other
pieces from one CSS file rather than one JS `import` each still keeps the
bundle to one copy of each.

- `styles/retro-tokens.css` holds the colors, bevels and fonts every piece is
  skinned from. Every piece imports it, so a page imports it on its own only
  to read the custom properties.
- `styles/retro-components.css` is the button, window, well and key/value grid
  together, in that order.
- `styles/retro-page.css` is for a standalone page (the sprite gallery, the
  404 page): it imports the tokens and components itself and adds a full-page
  layout and a dark-ground override. `styles.css` does not include it.
- `styles/not-found.css` is the "page not found" page. It imports
  `retro-page.css` itself, so it is the only file that page needs.
- `styles/starlight.css` dresses a [Starlight](https://starlight.astro.build)
  docs site in the game's look: the tokens, `styles/starlight-theme.css` (the
  How to Play window's title bar, sidebar and well, and the title screen for a
  page with a hero) and `styles/title-bar.css`, in that order (a `customCss`
  entry). Starlight puts its own CSS in the `starlight` layer, so the site
  declares `@layer starlight, vc;` in a `<style>` through Starlight's `head`
  option: `head: [{ tag: "style", content: "@layer starlight, vc;" }]`. A
  `customCss` entry comes too late for that, since Astro puts the CSS a
  page's scripts import (the menu bar's, from `windows/menuBar`) ahead of
  `customCss`, and that CSS would set `vc` first.
  The title screen's skyline is `/splash-skyline.svg`, which the site serves.
- `styles/title-bar.css` is the docs title bar on its own: the `.vc-bar`
  markup a docs site draws in its header, and that a page outside Starlight
  (such as `cargo doc` output) can draw on a navy bar of its own. Such a page
  takes the rules out of their `vc.page` layer (and drops the `@import`)
  when it inlines the file: rustdoc's own stylesheets are unlayered, so they
  beat a layered rule, and the bar's links come out navy on navy.
- `styles/schemes/skyline.css` and `styles/schemes/high-contrast.css` are the
  optional color schemes. Each applies only under `html[data-scheme="skyline"]`
  or `html[data-scheme="high_contrast"]`, and goes last.
- `styles/game/*` is the game page's own layout. It targets the game's markup
  and depends on the order `styles.css` gives it, so import `styles.css`
  rather than these files one by one.

#### Cascade layers

Every rule the components ship sits in a cascade layer under `vc`, declared
in this order at the top of every stylesheet:

```css
@layer vc.tokens, vc.base, vc.components, vc.page;
```

- `vc.tokens`: `retro-tokens.css`, the custom properties.
- `vc.base`: `game/base.css`, the reset and the document.
- `vc.components`: the button, window, well, key/value grid and menu bar,
  each in a layer of its own in that order (`vc.components.button` through
  `vc.components.menu-bar`, declared in a second statement), so a second copy
  of a sheet cannot change their order.
- `vc.page`: the overview map (`overview-map.css`, `overview-map-views.css`,
  which lay out the game's stage around the map), the game's layout
  (`styles/game/*`), the color schemes and the standalone pages
  (`retro-page.css`, `not-found.css`), in the order `styles.css` imports them,
  and the docs pages (`starlight-theme.css`, then `title-bar.css`).

A later layer beats an earlier one whatever the selectors, and a rule a page
writes outside any layer beats every `vc` rule, wherever the bundler puts the
two stylesheets. So a page restyles a piece with an ordinary rule, and a
token override on `:root` always wins. Two things work the other way round:
a `!important` inside a `vc` layer beats an unlayered `!important`, and a page
that puts its own CSS in layers orders them against `vc` with a statement of
its own before it loads the components (for example `@layer vc, app;`, or
`@layer starlight, vc;` on a Starlight site so the menu bar keeps its look).
That statement has to come before the first components CSS on the page,
including the sheet a window module imports, which a bundler may put ahead of
the page's own stylesheets.

Every stylesheet counts as a side effect, so a bundler keeps a CSS import even
though nothing names what it exports.

## Build and test

```sh
npm ci
npm run typecheck        # the library, then its tests, scripts/ and e2e/ (gallery/ reads lib/, so the Gallery workflow checks it after building)
npm run lint             # ESLint on src/, scripts/, gallery/ and e2e/, with eslint-plugin-lit on the templates
npm run icons:check      # the pixelarticons paths match the package; `npm run icons` rewrites them
npm run format:check     # Prettier; `npm run format` rewrites the files
npm test
npm run build                 # compiles src/ into lib/, what the package ships
npm run pack -- 0.0.0-local   # writes dist/verticopolis-components-0.0.0-local.tgz
```

The unit tests mock the engine and read its catalog from the JSON fixtures in
`src/simport/fixtures`, so they need no engine build. Every pull request and
push to `main` packs the tarball as a workflow artifact.

## Gallery

The component gallery is one page with every reusable piece in each color
scheme: the buttons, windows, wells and key-value rows, the menu bar, the
icons and the room sprites. It loads the built package from `lib/` the way a
consumer would, and paints the sprites with the engine's Modern catalog. The
overview map is not on it, since it draws a running tower.

```sh
npm run build           # the gallery reads lib/
npm run gallery         # a local server with the page
npm run gallery:build   # writes dist-gallery/
```

The Gallery workflow builds it on every pull request that touches the source,
and publishes it to GitHub Pages from `main`.

## Screenshot tests

The Screenshots workflow drives the gallery in Chromium and compares each
piece with the images in `e2e/__screenshots__`: the page window, the buttons,
windows, wells, the menu bar closed and with each menu open, and the icons in
every color scheme, plus each room sprite once, on a desktop and a phone
screen. A change that moves a pixel fails the check, and the run keeps the
diffs as an artifact.

The baselines come only from the pinned Playwright image
(`mcr.microsoft.com/playwright:v<version>-jammy`, the version in
`package-lock.json`), since glyph and canvas rasterization differ across
Chromium builds. To refresh them, push a commit whose message contains
`[update-screenshots]`; the Update screenshots workflow renders them in that
image and pushes them back as a commit on the branch. Run from the Actions
tab on `main`, it opens a pull request with the images instead of pushing to
`main`. Review that commit's images like code. The same image works locally:

```sh
npm ci
docker run --rm --ipc=host -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v<version>-jammy \
  sh -c 'CI=1 npx playwright test --update-snapshots'
```

`npm run screenshots` on any other browser runs the specs but skips the
pixel comparison (`PW_VISUAL=1` compares anyway).

## Releasing

A pull request that changes what the package ships adds a change note under
[`.changes/`](.changes/README.md), named after its branch, with its level
and its [`CHANGELOG.md`](CHANGELOG.md) entries: **major** for a breaking
change to an export or a stylesheet's selectors, **minor** for a new export,
component or look, **patch** for a fix, and `none` for a change that ships
nothing new. Notes keep two open pull requests from editing the
same changelog lines. The **Change notes** check requires one when a pull
request changes what the package ships (the paths are in
[`.changes/README.md`](.changes/README.md)), and refuses a feature pull
request that changes the version or the changelog's version sections.

**Cut release** (`.github/workflows/cut-release.yml`) opens the release PR,
as in the game's repository: run it from the Actions tab on `main`. It runs
`scripts/cut-release.ts`, which takes the highest level among the change
notes, raises `version` in `package.json` and `package-lock.json` with
`npm version`, writes the notes' entries into a new `## <version> (<date>)`
section of `CHANGELOG.md` (each led by its level, the highest first),
deletes the notes, commits that to `release/<version>` and
opens the "Release components <version>" PR. While the package is 0.x, a
**major** note raises the minor version; 1.0.0 comes only when the version
is named in the run. Leave the version empty for the level the notes ask
for, or name a later one. It refuses while another release PR is open. The
PR comes from the workflow token, which starts no checks, so start them with
the run button on the PR, or close and reopen it. The workflow needs "Allow
GitHub Actions to create and approve pull requests" (Settings, Actions,
General). To cut one by hand instead, run `node scripts/cut-release.ts` on a
clean `release/<version>` branch off `main`.

When the release PR merges, **Release components**
(`.github/workflows/components-release.yml`) packs that commit, tags
`v<version>` on it, publishes the GitHub release (named after the tag, and
Latest unless it is a prerelease) with the version's changelog section, the
tarball and its checksum, and then publishes that same tarball to npm and
bakes the sprite atlas onto the release ([docs/atlas.md](docs/atlas.md)). It
refuses a version with no changelog section, before it tags anything. Only the npm publish waits on the
`registry` environment, which only the owner approves, so a release takes
one approval, as in the engine. npm publishing uses
trusted publishing, so no npm token is stored anywhere and each version
carries an npm provenance statement.

A push that leaves the version alone releases nothing. A tag, release or npm
version that already exists is left alone, so running the workflow again
from the Actions tab on `main` finishes what a failed run started.

## Contributing

The components came out of the game's repository, and its rules came with
them: American English, no em-dashes in prose, a 500-line ceiling per source
file, and unit tests that stand in for the engine with spies.

Pull requests and issues for the components open here. The game takes a
change when a pull request in Verticopolis/web raises its
`@verticopolis/components` pin.

## History

This repository was extracted from `maniator/verticopolis`, now
Verticopolis/web, with every past path of every file kept, so `git log` and
`git blame` reach back to each line's first commit with the original authors,
dates and messages. `#123` in an old commit message was rewritten to
`Verticopolis/web#123`, the issue or pull request it meant.
`history/commit-map.txt` maps each commit here to the one it came from.

## License

Code is MIT, see [LICENSE](LICENSE). The visual and audio assets are CC BY 4.0,
see [ASSETS-LICENSE.md](ASSETS-LICENSE.md).
