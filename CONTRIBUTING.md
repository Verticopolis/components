# Contributing to the Verticopolis components

Pull requests and issues for the components open here. The game takes a
change when a pull request in
[Verticopolis/web](https://github.com/Verticopolis/web) raises its
`@verticopolis/components` pin. [README.md](README.md) has the layout, the
checks, the gallery, the screenshot tests and releasing, and
[ARCHITECTURE.md](ARCHITECTURE.md) has the design in diagrams.

## The rules

The components came out of the game's repository, and its rules came with
them:

- **No simulation.** Prices, sizes, caps and every other rule come from the
  game through the render model. Nothing here imports
  `@verticopolis/engine`, and the tests and the gallery use hand-written
  fixtures.
- **UI is drawn with lit-html** (see the next section).
- **Change notes, never a version edit.** A pull request that changes what
  the package ships adds a note under `.changes/` with its level
  ([`.changes/README.md`](.changes/README.md)).
- **Tests assert what they name**, with hand-written render-model fakes and
  `vi.fn` spies. No test reads source, CSS, workflow or configuration files.
- **A 500-line ceiling per source file.** Test files and generated files are
  exempt. Don't make a longer file longer; split it when you change it.
- **American English, and no em-dashes in prose** (docs, comments, commit
  and pull request text, and anything a player reads).
- **New art, a new look or a new sound** needs the owner's OK before merge.
- **An independent GO before every merge.** The review comes from someone
  other than the pull request's author, on its head commit, with every
  review thread resolved.
- **Merge commits only** to `main`, never a squash, and never a force-push
  to `main`. Force-pushing your own pull request branch is fine; keep its
  history readable before it merges.

Before you push, run `npm run typecheck`, `npm run lint`,
`npm run icons:check`, `npm run format:check`, `npm test` and
`npm run build`. Prettier owns the layout, so run `npm run format` first.
Fill in every heading of the pull request template.

## Drawing UI with lit-html

Every piece of DOM the package or the gallery draws (windows, menus,
dialogs, notices, icons, demos) is a [lit-html](https://lit.dev/docs/libraries/standalone-templates/)
template. Write the markup in an `html` (or `svg`) tagged template, bind its
events with `@event`, and put it on the page with `render`:

```ts
import { html, render } from "lit-html";

const okButton = (label: string, onOk: () => void) =>
  html`<button class="btn" type="button" @click=${onOk}>${label}</button>`;

render(okButton("OK", close), host);
```

lit escapes every value it puts in the markup, and a later `render` with new
values updates only what changed, so a piece redraws by rendering again.

Don't build the markup any other way:

- No markup in strings: no `innerHTML`, `outerHTML` or `insertAdjacentHTML`,
  and no HTML put together by concatenating or escaping text.
- No hand-built trees: no `createElement` and `appendChild` to make the
  elements, and no `addEventListener` on an element a template draws.

Imperative code is left only for what no template owns: listeners on
`window`, `document` or an element the game owns, and the canvas the
renderer and the atlas bake draw on. A piece that has to go inside an
element the game owns renders into a fragment of its own first, then is
placed from it, so it never shares that element's render slot.

Some older UI still builds DOM by hand while it moves onto lit. A change to
one of those pieces moves it onto lit, and leaves no old function or option
beside the new one: the game and the other consumers move to the new API
when they raise the pin.

`npm run lint` runs [eslint-plugin-lit](https://github.com/43081j/eslint-plugin-lit)
over the templates (bindings in valid positions, no duplicate attributes,
well-formed markup).

## The BMAD setup

Every Verticopolis repository carries the same BMAD install (core and bmm
6.9.0, cis v0.2.1, gds v0.6.0, listed in `_bmad/_config/manifest.yaml`) and
its own outputs. Only `_bmad/custom/` (this repository's overrides) and
`_bmad-output/` (its context, backlog, records and party memory) differ from
one repository to the next.

- A change to a skill in `.agents/skills/`, to `_bmad/` outside
  `_bmad/custom/`, or a BMAD upgrade ships to every repository on the same
  day, as one pull request per repository, each linking the others.
- Before such a pull request opens, compare the install with
  Verticopolis/web's from checkouts side by side. The only differences should
  be the ones the change explains:

  ```sh
  diff -r ../web/.agents/skills .agents/skills
  diff -r -x custom ../web/_bmad _bmad
  ```

- A need of this repository alone goes in `_bmad/custom/<skill>.toml`, never
  into the installer-managed files.
- The hot-path checklist stays one page,
  `docs/performance/hot-path-review.md` in Verticopolis/web; the review
  overrides here read it from there.
