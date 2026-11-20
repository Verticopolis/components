---
package: minor
---
- `styles.css` adds `desk-pocket.css`, the desk on touchscreens: `body.desk-touch` gives the desk a 44 px taskbar, 44 px menu rows and 44 px touch areas on title-bar buttons, and `body.desk-pocket` lays out the pocket desk, a full-screen tower window whose `.desk-pocket-body` grid holds Info, Tools and the tower, with the Map floating over the tower at the size it has on phones.
- `windows/desk/deskPocket` exports the pocket desk's pieces for a game: the classes (`DESK_TOUCH_CLASS`, `DESK_POCKET_CLASS`, `POCKET_BODY_CLASS`), the media queries (`TOUCH_MQ`, `TOUCH_DESK_MQ`), `deskMode` (which desk a screen gets: the full desk, the pocket desk or none) and `pocketBody` (the grid, drawn with lit-html).
