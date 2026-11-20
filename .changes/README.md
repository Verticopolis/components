# Change notes

A pull request does not edit `CHANGELOG.md` or the version. It adds one note
here, named after its branch (`claude/project-thread-abc123` becomes
`claude-project-thread-abc123.md`), so two open pull requests never touch the
same file:

```
---
package: minor    # major | minor | patch | none
---
- `presentation/statusBar` exports `StatusBar`, the game's bottom strip.
```

- `package` is the level from the README's "Releasing": **major** for a
  breaking change to an export or a stylesheet's selectors, **minor** for a
  new export, component or look, **patch** for a fix. While the package is
  0.x a major note raises the minor version. `none` says the pull request
  changes nothing the package ships; such a note has no entries.
- Each entry is one `- ` bullet, written for people who build on the package
  and starting where the text after `- **<level>**: ` would, with any further
  lines indented two spaces. The release leads each entry with the note's
  level, so leave the level out of the entry.
- A pull request that changes `src/` outside its tests needs a note, a
  `package: none` one included. CI, the gallery, the screenshot tests and
  docs alone need none, and neither do Dependabot's branches, which cannot
  write one.
- A note that is already on `main` belongs to the pull request that merged
  it. A follow-up pull request from the same branch name adds
  `<branch-slug>-2.md` instead of editing it; only the release PR removes a
  pending note.

**Cut release** (`.github/workflows/cut-release.yml`, README "Releasing")
raises the version by the highest pending level, writes every note's entries
into the new version's section of `CHANGELOG.md` (the highest level first),
and deletes the notes. The **Change notes** check
(`.github/workflows/change-notes.yml`) runs
`node scripts/change-notes-check.ts --base origin/main` on every pull
request; the rules are in `scripts/changeNotes.ts`.
