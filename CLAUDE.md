# CLAUDE.md

This repository is the Verticopolis components package
(`@verticopolis/components`): the renderer and Excalibur scene, the Win95
windows and menus, and the procedural sprites and audio. They read a render
model each game fills from its simulation, and depend on no simulation
package. [README.md](README.md) has the layout, the
checks, the gallery, the screenshot tests and releasing, and
[ARCHITECTURE.md](ARCHITECTURE.md) has the design in diagrams. Read both.

## The BMAD setup

This repository carries its own BMAD install: the BMAD/BMGD skills in
`.agents/skills/` (`.claude/skills` links to it), the workflow engine in
`_bmad/`, this repository's overrides in `_bmad/custom/`, and its own
outputs in `_bmad-output/`: the project context
(`_bmad-output/project-context.md`), the backlog
(`_bmad-output/implementation-artifacts/backlog.md`), specs, plans and party
findings. Run the skills from this repository's root so they read its config
and write to its backlog. Run the review skill on every non-trivial change
here: `/gds-code-review` for the renderer, input, audio and the render model,
`/bmad-code-review` for CI, packaging and tooling. Rendering, the frame
loop, UI and audio are hot paths and also get the hot-path checklist
(`docs/performance/hot-path-review.md`), which stays one page in
[Verticopolis/web](https://github.com/Verticopolis/web); the review
overrides read it from there. Keeping the install in step with the other
repositories is in CONTRIBUTING.md, "The BMAD setup".

## Non-negotiables

- **No simulation rules, code or data.** Prices, sizes, caps and every
  other rule come from the game, through the render model's catalog and
  rules; a rule change lands in
  [Verticopolis/engine](https://github.com/Verticopolis/engine). Nothing
  here imports `@verticopolis/engine` (lint refuses it), and the tests, the
  gallery and the atlas bake use hand-written fixtures, never a copy of the
  engine's catalog.
- **UI is drawn with lit-html.** Every piece of DOM the package or the
  gallery draws (windows, menus, dialogs, notices, icons, demos) is a
  lit-html `html` or `svg` template put on the page with `render`, and its
  events are `@event` bindings in that template. Never write markup as a
  string (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, or HTML built by
  concatenating or escaping text), and never put it together by hand with
  `createElement`, `appendChild` or an `addEventListener` on an element a
  template draws. Imperative code is left only for what no template owns:
  listeners on `window`, `document` or an element the game owns, and the
  canvas the renderer and the atlas bake draw on. Some older UI still
  builds DOM by hand while it moves onto lit; a change to one of those
  pieces moves it onto lit and leaves no old API beside it. See
  [CONTRIBUTING.md](CONTRIBUTING.md).
- **Design sign-off.** New art, a new look or a new sound needs the owner's
  explicit OK before merge. A party or roundtable verdict is not that OK.
- **Change notes, never a version edit.** A PR that changes what the package
  ships adds `.changes/<branch-slug>.md` with its `package:` tier (major,
  minor, patch or none). Only the release PR raises the version and writes
  `CHANGELOG.md` (`.changes/README.md`).
- **Quality gates before pushing:** `npm run typecheck`, `npm run lint`,
  `npm run icons:check`, `npm run format:check`, `npm test`, `npm run build`.
  Prettier owns code layout; run `npm run format` before committing.
- **Unit tests use render-model fakes** (the hand-written catalogs in
  `src/tests/catalogFixture.ts`, the rules in `src/tests/renderRules.ts`, and
  `vi.fn` spies) and assert what they name. A test that needs a real
  simulation belongs in the game that runs one.
- **No guard tests.** Never add a test that reads source, CSS, workflow
  or configuration files. Check workflows with actionlint and real CI runs.
- **A 500-line ceiling per source file.** Test files and generated files
  are exempt. Nothing checks it yet, and some files are already over: don't
  make one longer, and split it when you change it.
- **American English everywhere. No em-dashes in prose** (docs, comments,
  commit and PR text, player-facing copy); use commas, colons, parentheses or
  separate sentences. Skip the "X, not Y" emphatic pattern and marketing
  vocabulary.
- **An independent GO before every merge.** The review comes from a
  separate thread or person, never the PR's author, on the PR's head
  commit, with every review thread resolved.
- **Merge commits only** to `main`, never a squash, and never force-push
  `main`. Force-pushing your own PR branch is fine. Keep a branch's own
  history readable before it merges.
- **PR descriptions follow `.github/PULL_REQUEST_TEMPLATE.md`:** keep every
  `## ` heading and fill each one.
