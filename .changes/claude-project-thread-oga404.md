---
package: patch
---
- The game sheets that a module imports for itself (`styles/game/file-dialog.css`,
  `splash.css`, `screen-saver.css` and `appearance.css`) now sit in a new
  `vc.windows` layer below `vc.page`. A second copy of one of them, emitted by
  a bundler after the game's own page sheets, no longer undoes the game's later
  rules. The modal width for the Open and Save As window and Previous Versions
  moved into `styles/game/dialogs.css`, beside the modal's own rules.
