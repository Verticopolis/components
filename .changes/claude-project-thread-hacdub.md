---
package: minor
---
- `windows/desk/deskGeometry` has a Help window: `DeskWindowId` gains
  `"help"`, `defaultLayout` opens it in the middle of the desk at
  `HELP_WIDTH` x `HELP_HEIGHT` (shrunk to fit a small desk), `HELP_LIMITS`
  holds its smallest size, and `parseLayout` reads its saved place.
  `DESK_WINDOW_IDS` lists every desk window in the order the desk builds and
  saves them.
