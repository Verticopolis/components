---
package: minor
---
- `windows/desk/deskGeometry` has a Help window: `DeskWindowId` gains
  `"help"`, `defaultLayout` opens it in the middle of the desk at
  `HELP_WIDTH` x `HELP_HEIGHT` (shrunk to fit a small desk), `HELP_LIMITS`
  holds its smallest size, and `parseLayout` reads its saved place.
  `DESK_WINDOW_IDS` lists every desk window in the order the desk builds and
  saves them.
- `windows/desk/deskHelp` exports `buildHelpWindow`, the Help window: the
  Player's Manual in a page frame under its own menu bar (the game's
  `MenuBarModel`, re-rendered through `menus`; Alt stays with the game's bar)
  and Contents, Back, Forward and Open in Browser (`setNav` turns Back and
  Forward on and off), styled in `styles/game/desk.css`. Its `dispose`
  takes the menu bar's page listeners off once the window is gone.
- `windows/menuBar`: `MenuBar.dispose()` takes the bar's window and document
  listeners off, for a bar whose page outlives it.
- `windows/desk/deskWindow`: a window counts as pressed when the focus moves
  into a frame inside it (a press or Tab into the Help window's manual, which
  never reaches the game's page), so it comes to the front and lights its
  title bar. `dispose` also drops a focus check the page's blur had queued.
- The gallery's sample desk has the Help window, opened from Help > Player's
  Manual or the Verticopolis menu, with a sample manual in its frame.
