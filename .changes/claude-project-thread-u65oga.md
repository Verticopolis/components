---
package: minor
---
- `windows/bars/topBar`: every Information bar control but the speeds is
  optional. An action left out of `TopBarActions` (`undo`, `redo`, `save`,
  `mute`, `update`, `install`, `traffic`) draws no control, `TopBarView.traffic`
  and the button flags are optional, and `brand: false` leaves out the badge.
  A page that passes everything draws the bar as before.
