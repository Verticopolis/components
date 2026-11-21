---
package: minor
---
- `windows/palette/toolPalette` is the game's Tools window as lit templates. `ToolPalette` draws the
  pinned tools and a section per build category into the game's `.palette-scroll`, and the phone's
  category tabs into its `.palette-tabs`, from the tools a game hands in with `update(view)`: their
  names, prices, swatches and descriptions, and which are locked, out of reach of the funds or
  picked. It keeps the open tab, the "new" pips on a tab whose category gained tools, and the folded
  categories (stored under a key the game names). Every tool keeps its element across updates, so
  the focus and a class the game adds stay on it.
- `windows/palette/pressKeys` gives a `role="button"` element a native button's Enter and Space,
  and `windows/palette/paletteFolds` loads and keeps the folds.
- `styles/game/tools-stage.css` places Inspect's and Bulldoze's icon on the name's line itself.
- The gallery has a Tools window page.
