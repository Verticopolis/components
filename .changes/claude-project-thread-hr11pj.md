---
package: minor
---
- `windows/desk/deskTitle`: `DeskTitle` takes an optional `controlPanel` (the
  `ControlPanel` options) and holds the desk's Control Panel over the title
  screen, closed until `openControl()` or the tray's monitor opens it, with a
  `control` getter for its labels. `desk-title.css` opens it in the middle of
  the title window and `desk-title-pocket.css` across the window under its
  menu bar; the menu bar's menus and the Start menu open over it. The desk
  windows' chrome now applies under `body.desk-title` (and the touch chrome
  under `body.desk-title-pocket`), so it wears the same title bar as on a tower.
