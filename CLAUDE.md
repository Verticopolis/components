# CLAUDE.md

This repository is the Verticopolis components package
(`@verticopolis/components`): the renderer and Excalibur scene, the Win95
windows and menus, the procedural sprites and audio, and the code a
frontend uses to drive the engine. [README.md](README.md) has the layout, the
checks, the gallery, the screenshot tests and releasing. Read it.

## Load the game's repository too

The agent workflow is not copied here. The BMAD/BMGD skills, the review
skills (`/gds-code-review`, `/bmad-code-review`), the hot-path checklist
(`docs/performance/hot-path-review.md`) and the agent rules (`AGENTS.md`,
`_bmad-output/project-context.md`) live in
[Verticopolis/web](https://github.com/Verticopolis/web). Load it in the same
session, and run its review skill on every non-trivial change here:
`/gds-code-review` for the renderer, input, audio and the engine seam,
`/bmad-code-review` for CI, packaging and tooling. Rendering, the frame
loop, UI and audio are hot paths and also get the hot-path checklist.

## Non-negotiables

- **No simulation rules.** Prices, sizes, caps and every other rule come
  from the engine's catalog and commands; a rule change lands in
  [Verticopolis/engine](https://github.com/Verticopolis/engine).
- **Design sign-off.** New art, a new look or a new sound needs the owner's
  explicit OK before merge. A party or roundtable verdict is not that OK.
- **Change notes, never a version edit.** A PR that changes what the package
  ships adds `.changes/<branch-slug>.md` with its `package:` tier (major,
  minor, patch or none). Only the release PR raises the version and writes
  `CHANGELOG.md` (`.changes/README.md`).
- **Quality gates before pushing:** `npm run typecheck`, `npm run lint`,
  `npm run icons:check`, `npm run format:check`, `npm test`, `npm run build`.
  Prettier owns code layout; run `npm run format` before committing.
- **Unit tests mock the engine** (`vi.fn` spies with the JSON fixtures in
  `src/simport/fixtures` as canned answers) and assert what they name.
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
