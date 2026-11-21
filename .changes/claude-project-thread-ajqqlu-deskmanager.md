---
package: minor
---
- `windows/desk/deskManager` is the desk's window manager: `DeskManager` gives the focus and
  stacks the windows, keeps the taskbar's entries, runs a taskbar press (`deskTaskResult`) and
  the window menu, opens each window at its saved place or the page's own, remembers a maximized
  app window, keeps small windows off its menu bar, pulls windows back onto a desk that shrank,
  and brings up a window the page opens its own way. Window ids are the page's own.
- `windows/desk/deskScreen` reads the screen for `deskMode` (`deskScreenOf` with `DESK_QUERIES`
  or a page's own queries, `watchDeskScreen`) and keeps the `?desk=` testing switch
  (`heedDeskSwitch`, `readDeskSwitch`) under a key and parameter the page names.
- `windows/desk/deskTitle` draws the title screen's window title bar and taskbar on the desk into
  a root the page names (`DeskTitle`).
- `windows/desk/deskStore` reads and writes storage without throwing (`read`, `write`,
  `localStore`).
- `DeskWindow`, `DeskWindowSpec`, `windowMenuState`, `runWindowCommand` and `parseLayout` take
  a page's own window ids (the game's stay the default), and `DESK_WINDOW_IDS` lists the game's.
- The gallery's desk runs on `DeskManager`: the taskbar lists the tower first, and a maximized
  tower stays under the small windows, which step below its menu bar, as in the game.
