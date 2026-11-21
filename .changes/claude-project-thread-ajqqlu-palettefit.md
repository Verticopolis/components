---
package: minor
---
- `windows/palette/paletteFit` fits the desktop Tools window's tools without a scrollbar:
  `PaletteFit` tries compact rows, then two columns, then both, and fits again when the window's
  height changes, the viewport crosses the desktop layout, a tool under a folded category starts or
  stops showing, or the game calls `refit()` after tools show or hide.
- `windows/palette/paletteCollapse` draws the button on the Tools window's title bar that folds the
  window into a strip (`PaletteCollapse`), keeps the choice under a key the game names, and opens the
  window around a tool a guide points at.
- `windows/palette/paletteFolds` exports `PALETTE_FOLDED_CLASS`.
