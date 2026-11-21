---
package: minor
---
- `windows/alertCard` exports `AlertCard`, a modal card that holds the page
  until one of its buttons is pressed (a crash card), or until its caller
  closes it (a wait card), with a status line it redraws on `update`.
- `windows/updateBox` exports `updateBoxView`, the update box for the shared
  modal: the incoming version's notes as a list or a scrolling well, every
  skipped version's notes, a release notes link, the build lines, and Later
  and Update now.
- The update box's rules (`.whatsnew`, `.build-id`) move from
  `styles/game/new-tower.css` to `styles/game/dialogs.css`, right where
  `styles.css` read them before, so the game sees no change and a page that
  loads only `dialogs.css` gets the update box's look.
