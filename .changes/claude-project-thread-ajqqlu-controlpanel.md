---
package: minor
---
- `windows/desk/deskControlPanel` draws the desk's Control Panel: `ControlPanel` takes the icons
  (`ControlItem`: one of the four the package draws, a name and a tooltip), the ✕'s label, a
  `picked` callback and an optional title and title-bar icon. `setLabel` renames an icon while
  the window is open. The gallery has a Desktop > Control Panel page.
