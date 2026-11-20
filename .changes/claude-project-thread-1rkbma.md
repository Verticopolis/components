---
package: minor
---
- `styles/starlight.css` now also wears the game's color schemes, through the
  new `styles/starlight-schemes.css`: under `html[data-scheme="skyline"]` or
  `html[data-scheme="high_contrast"]`, a Starlight site's header, selected
  row, buttons and title-screen buttons take the scheme's shapes, and High
  Contrast sets Starlight's own colors to white on black. Nothing changes on
  a page without `data-scheme`.
- New `styles/starlight-menu-bar.css`: the game's menu bar across the top of a
  Starlight site, above the title bar. A site with the bar adds it after
  `starlight.css`; see the README's Styles section.
