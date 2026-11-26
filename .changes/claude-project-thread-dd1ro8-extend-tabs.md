---
package: patch
---
- `render/excalibur/TowerEngine` draws a selected elevator's extend tabs only
  when the game sets `onExtendTo`, so a game that does not extend shafts shows
  the outline alone, with no tabs that do nothing.
