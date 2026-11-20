---
package: minor
---
- `windows/desk/deskWindow` takes the title bar's icon from the page: `DeskWindowSpec.icon`, and a last `icon` argument on `buildFrame` and `deskFrameTemplate`, name its URL. `DESK_ICON` (`./favicon.png`, the icon a window wore before) is the default when none is named.
- New `windows/desk/deskTaskbar`: `DeskTaskbar` draws the desk's taskbar with lit: the Verticopolis button and its menu (items named by the game, Up and Down, Escape, a press outside), a button per open window that opens its window menu on a right-click or Shift+F10, and the tray with the Control Panel's monitor, the speaker and a clock that wakes once a minute. A game that drew its own taskbar over `desk.css` passes its items and handlers instead.
