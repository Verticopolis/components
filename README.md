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
| `@verticopolis/components/shared/*` | `src/shared/` | Small shared helpers |
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

A page that wants only some pieces imports the parts itself, in this order,
because each one is skinned from the tokens and later files restyle earlier
ones:

```js
import "@verticopolis/components/styles/retro-tokens.css";       // 1. colors, bevels, fonts
import "@verticopolis/components/styles/retro-components.css";   // 2. .btn, .win, .well, .kv
import "@verticopolis/components/styles/overview-map.css";       // 3. then the pieces you use
import "@verticopolis/components/styles/overview-map-views.css"; //    after overview-map.css
import "@verticopolis/components/styles/menu-bar.css";
```

- `styles/retro-page.css` is for a standalone page (the sprite gallery, the
  404 page): it imports the tokens and components itself and adds a full-page
  layout and a dark-ground override. `styles.css` does not include it.
- `styles/not-found.css` is the "page not found" page. It imports
  `retro-page.css` itself, so it is the only file that page needs.
- `styles/schemes/skyline.css` and `styles/schemes/high-contrast.css` are the
  optional color schemes. Each applies only under `html[data-scheme="skyline"]`
  or `html[data-scheme="high_contrast"]`, and goes last.
- `styles/game/*` is the game page's own layout. It targets the game's markup
  and depends on the order `styles.css` gives it, so import `styles.css`
  rather than these files one by one.

Every stylesheet counts as a side effect, so a bundler keeps a CSS import even
though nothing names what it exports.

## Build and test

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build                 # compiles src/ into lib/, what the package ships
npm run pack -- 0.0.0-local   # writes dist/verticopolis-components-0.0.0-local.tgz
```

The unit tests mock the engine and read its catalog from the JSON fixtures in
`src/simport/fixtures`, so they need no engine build. Every pull request and
push to `main` packs the tarball as a workflow artifact.

## Releasing

A release PR raises `version` in `package.json` (and `package-lock.json`,
with `npm version <x.y.z> --no-git-tag-version`). When it merges, **Release
components** (`.github/workflows/components-release.yml`) packs that commit,
tags `v<version>` on it, publishes the GitHub release (named after the tag,
and Latest unless it is a prerelease) with the tarball and its checksum, and
then publishes that same tarball to npm. Both of those jobs wait on the
`registry` environment, which only the owner approves. npm publishing uses
trusted publishing, so no npm token is stored anywhere and each version
carries an npm provenance statement.

A push that leaves the version alone releases nothing. A tag, release or npm
version that already exists is left alone, so running the workflow again
from the Actions tab on `main` finishes what a failed run started.

## Contributing

The components came out of the game's repository, and its rules came with
them: American English, no em-dashes in prose, a 500-line ceiling per source
file, and unit tests that stand in for the engine with spies.

These components live here now. Pull requests open here once the game
builds from this repository's packages, which takes a few days. Until then,
changes to these folders are on hold everywhere, Verticopolis/web included.
Issues are welcome here now.

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
