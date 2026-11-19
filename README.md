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
npm install @verticopolis/components excalibur tone lit-html
```

The package is not on npm yet. Each folder is a subpath export:

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

For example, `import { MenuBar } from "@verticopolis/components/windows/menuBar"`.

Excalibur, Tone and lit-html are peer dependencies, and
`@verticopolis/engine` is an optional peer. A host defines four build
constants (`__APP_VERSION__`, `__APP_SHA__`, `__TOOLING_ENGINE__`,
`__ENGINE_PACKAGE__`), declared in `src/env.d.ts`; with Vite that is its
`define` option.

## Build and test

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run pack -- 0.0.0-local   # writes dist/verticopolis-components-0.0.0-local.tgz
```

The unit tests mock the engine and read its catalog from the JSON fixtures in
`src/simport/fixtures`, so they need no engine build. Every pull request and
push to `main` packs the tarball as a workflow artifact, and a
`components-v<version>` tag attaches it to that tag's GitHub release.

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
