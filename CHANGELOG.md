# Components changelog

Release notes for `@verticopolis/components`, one `## <version>` section per
package version, newest first, written for people who build on the package.
The player-facing notes live in the game's
[`CHANGELOG.md`](https://github.com/Verticopolis/web/blob/main/CHANGELOG.md),
and the engine's in
[`engine-rs/CHANGELOG.md`](https://github.com/Verticopolis/engine/blob/main/engine-rs/CHANGELOG.md).

A pull request that changes what the package ships adds a line under
`## Unreleased`, led by the level it needs: **major** for a breaking change to
an export or a stylesheet's selectors, **minor** for a new export, component
or look, **patch** for a fix. A change to the repository alone (CI, the
gallery, the screenshot tests) needs no line. **Cut release** picks the
version from those levels and its release PR renames `## Unreleased` to
`## <version> (<date>)`, and **Release components** puts
that section in the GitHub release; it refuses a version with no section
(README, "Releasing").

Entries up to 0.2.2 were written afterward from the history of the pull
requests that made each version.

## Unreleased

- **minor**: `src/shared/` is now `src/model/`, exported as `model/*`: the
  tower model types and the small helpers over them. `shared/*` stays as an
  alias for the same files until 1.0, so existing imports keep working; move
  them to `model/*`.

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
