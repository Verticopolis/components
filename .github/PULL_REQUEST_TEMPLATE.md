<!--
Thanks for contributing to the Verticopolis components! Fill in the sections
below. Keep every rule of the simulation in the engine (Verticopolis/engine):
this package draws, plays and binds, and decides nothing about how the game
plays. Use American English and write no em-dashes.
Keep every ## heading and write something under each one: "None" or
"n/a: <reason>" where a section does not apply. The PR template check
(.github/workflows/pr-template.yml) fails a description that drops a heading.
Opening a PR through the API or `gh pr create --body` skips this template, so
start that body from this file.
-->

## What & why

<!-- What does this change do, and what problem does it solve? Link any related issue. -->

Closes #

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New component or export
- [ ] Visual or audio change (new art, a new look, a new sound)
- [ ] Breaking change to an export
- [ ] Refactor / internal-only (no visible or API change)
- [ ] Docs / tooling

## Quality gates

<!-- All must be green before merge. -->

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run format:check` (`npm run format` fixes it)

## Versioning

<!--
Only a release PR, which the Cut release workflow opens, edits `version`
in package.json and CHANGELOG.md; merging it releases that version. A change
to what the package ships adds a change note under .changes/ named after its
branch, with its level (**major**, **minor**, **patch** or none) and its
changelog entries (.changes/README.md).
-->

- [ ] Left `version` alone, **or** this is a release PR
- [ ] Added a change note with its level under `.changes/`, **or** this PR changes nothing the package ships
- [ ] Updated the README where it went stale, **or** read it and it did not

## Complexity

<!--
A change to a hot path (rendering, the frame loop, the WASM binding and host,
UI, audio and the other surfaces in section 1 of
https://github.com/Verticopolis/web/blob/main/docs/performance/hot-path-review.md)
fills in the note from section 5 of that page: hot paths and callers, sizes,
complexity before and after, remaining scans and why, the caches and counters
kept or replaced (HP-8), invalidation evidence, measurements. Any other change
may replace the first line below with "n/a: <reason>". The second line links
the section 6 review record once a review has posted it on this PR, or says
"no hot-path surface".
-->

Hot paths and call frequency (tier), sizes, complexity before and after, remaining scans and why, caches kept or replaced (HP-8), invalidation evidence, measurements:

Hot-path record (section 6): link

## Screenshots / recordings

<!--
For any visual or audio change, embed actual before/after images or a
recording here, not a prose description. If the change has nothing to see or
hear, write "None: <reason>".
-->

## Notes for reviewers

<!-- Trade-offs, follow-ups, anything that helps the review. "None" if nothing. -->
