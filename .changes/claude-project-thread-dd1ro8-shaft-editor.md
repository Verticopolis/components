---
package: minor
---
- `windows/editorCard` draws the editor card's frame: `editorCardTemplate`
  (a title bar with its ✕, a grid of facts, an optional block and action
  rows), with `editorFact` and `editorActionRow` for the pieces.
- `windows/shaftEditor` draws a shaft's editor card: `shaftEditorTemplate`
  shows its floors and an elevator's cars, capacity and stops, and carries
  the buttons the game offers (`– Car`, `+ Car`, `Schedule…`, the extend
  arrows, `Sell / Bulldoze`), each calling the game's `act` with its
  action. The game words the stops line and names any offered button that
  is off; `+ Car` is also off at the catalog's car limit.
