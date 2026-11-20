# Project Context: Verticopolis components (AI agent rules)

Foundational context every BMAD agent (bmm / cis / **gds game agents**) must carry
when working in Verticopolis/components. Concise on purpose: only the non-obvious
rules an LLM needs reminding of. [CLAUDE.md](../CLAUDE.md),
[README.md](../README.md), [ARCHITECTURE.md](../ARCHITECTURE.md) and
[CONTRIBUTING.md](../CONTRIBUTING.md) hold the full rules.

## What this is
- The **`@verticopolis/components`** package: the renderer and Excalibur scene,
  the Win95 windows, menus and desk (taskbar, Start menu, tray, dialogs), and the
  procedural sprites and audio. Every Verticopolis game draws with it.
- It reads a **render model** that each game fills from its own simulation, and
  depends on no simulation package. Nothing here imports `@verticopolis/engine`
  (lint refuses it), and no engine names, shims or data live here. Engine glue
  lives in the games that use this package.
- **Every reusable piece of UI lives here.** A game keeps no copy of a window,
  menu, taskbar, tray or dialog; it uses this package's.
- Verticopolis is a clean-room homage to **SimTower (1994)**: all art and audio
  are made for Verticopolis in code, never ripped or imported from the original.

## No simulation rules, code or data
- Prices, sizes, caps and every other rule reach this package through the render
  model's catalog and rules. A rule change lands in Verticopolis/engine.
- Tests, the gallery and the atlas bake use hand-written fixtures
  (`src/tests/catalogFixture.ts`, `src/tests/renderRules.ts`), never a copy of the
  engine's catalog. A test that needs a real simulation belongs in the game that
  runs one.

## UI is drawn with lit-html
- Every piece of DOM (windows, menus, dialogs, notices, icons, gallery demos) is
  a lit-html `html` or `svg` template put on the page with `render`, with
  `@event` bindings. Never `innerHTML`, string-built markup, or `createElement`
  plus `appendChild`. Imperative code is left only for listeners on `window`,
  `document` or an element the game owns, and the canvases the renderer and the
  atlas bake draw on. A change to an older hand-built piece moves it onto lit and
  leaves no old API beside it (no back-compat shims: update the consumers).

## Look and design system
- `docs/design-system.md` is the contract for all UI and CSS work: tokens and
  components (`.btn`, `.win`, `.win-title`, `.well`, `.field`, `.kv`) in
  `src/styles.css` and the parts it imports, organized as ONE generation of CSS.
  **No skin on IDs; edit rules, never out-specify them; press-only button
  feedback; one primary per dialog; the splash is box art and stays un-unified.**
- The UI is classic Win95: blocking message boxes, "…" on dialog items that open
  more. Every window documents its resize, minimize and maximize behavior and its
  sizes.
- **New art, a new look or a new sound needs the owner's explicit OK before
  merge.** Keep such PRs draft until the owner signs off. A party verdict is not that OK.
- `docs/audio.md` describes the audio layer, `docs/atlas.md` the sprite atlas and
  `docs/desk.md` the desktop.

## Performance & platform gotchas
- Rendering, the frame loop, UI and audio are **hot paths**. They get the
  complexity checklist, `docs/performance/hot-path-review.md` in
  Verticopolis/web (one page for every repository). Towers reach tens of
  thousands of units, up to 110 floors and thousands of people: look entities up
  by id, keep counters instead of re-scanning, and do per-revision work once.
  Nothing ever gets slower.
- **Excalibur physics is deliberately disabled** (nothing uses it; enabled, it
  froze phones on big towers at high speed). Do not re-enable it.
- **Never draw one oversized surface**: tall shafts and the ground plane are
  tiled into texture-size-safe bands, or mobile GPUs render them as black
  rectangles. Keep new large visuals banded the same way.
- **WebGL context loss recovers in place.** Don't add "refresh the page" dead
  ends; a frame-exception guard keeps one bad frame from freezing the game.
- Keep Tone.js and Excalibur.

## Artifacts & working conventions
- BMAD output lives under `_bmad-output/` in this repository: the backlog in
  `implementation-artifacts/backlog.md`, specs beside it, plans in
  `planning-artifacts/`, party findings in `party-mode/`. Records dated before
  2026-11-20 came over from Verticopolis/web with their history; the paths they
  name (web's `src/render/...`, `src/audio/...`) are the paths of that time.
- **Deep adversarial review is mandatory, in the same session that writes the
  code:** `/gds-code-review` for the renderer, input, audio and the render model,
  `/bmad-code-review` for CI, packaging and tooling. Fix every `patch` finding,
  record every `defer` in `_bmad-output/implementation-artifacts/backlog.md`. An
  independent GO from a separate thread or person comes before every merge.
- **Backlog rows mirror to GitHub issues in this repository** (see the backlog's
  "How items flow").
- **Tests:** every test asserts what its name promises; no guard tests (never a
  test that reads source, CSS, workflow or configuration files). Screenshots come
  from the pinned Playwright container.
- **Change notes, never a version edit:** `.changes/<branch-slug>.md` with its
  `package:` tier.
- **Prose:** American English, no em-dashes, no "X, not Y" emphatic pattern, no
  marketing vocabulary. A 500-line ceiling per source file (tests and generated
  files exempt).
- **Merge commits only** to `main`, never a squash.
