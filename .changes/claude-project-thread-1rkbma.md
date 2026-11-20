---
package: minor
---
- `styles/starlight.css` dresses a Starlight docs site in the game's look:
  the tokens, `styles/starlight-theme.css` (the How to Play window's title
  bar, sidebar and reading well, and the title screen for a page with a hero)
  and `styles/title-bar.css` (the docs title bar's `.vc-bar` markup). These
  are the stylesheets the engine docs and the help site each kept a copy of.
  Both new sheets sit in `vc.page`; a Starlight site loads a file holding
  `@layer starlight, vc;` first (README, "Styles").
