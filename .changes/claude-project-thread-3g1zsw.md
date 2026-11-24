---
package: minor
---
- `windows/desk/deskTaskbar`: the taskbar's Start button reads "Start" (it read "Verticopolis"), and its menu's accessible name is "Start", so the button reads apart from a window named Verticopolis.
- `windows/desk/deskTitle`: `DeskTitle.show(true)` puts the title screen on the pocket desk, with `body.desk-title-pocket` (`DESK_TITLE_POCKET_CLASS`) beside `body.desk-title`; a second `show` switches between the two desks. The new `styles/game/desk-title-pocket.css`, part of `styles.css`, fits the window to a phone under the browser's bars, menu bar kept: the poster on top and the buttons stacked below when upright (two by two on a short screen), the buttons in a panel beside the poster held sideways, and the pocket desk's 44 px taskbar. A window too short for its buttons scrolls.
- `styles/game/desk-title.css`: the title window's Sponsor, Install and sound buttons sit above the logo's box, so a tap on their lower half no longer lands on the logo.
