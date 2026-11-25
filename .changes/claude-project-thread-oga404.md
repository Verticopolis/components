---
package: minor
---
- The game sheets that a module imports for itself (`styles/game/file-dialog.css`,
  `splash.css`, `screen-saver.css` and `appearance.css`) now sit in a new
  `vc.windows` layer below `vc.page`. A second copy of one of them, emitted by
  a bundler after the game's own page sheets, no longer undoes the game's later
  rules. A page that styled these windows by relying on source order should
  check its rules: every `vc.page` rule now beats them. The modal width for
  the Open and Save As window and Previous Versions, and the paragraph margin
  of the Replace question and the folder prompt, moved into
  `styles/game/dialogs.css`, beside the modal's own rules. The focus rings, the
  splash's tall phone buttons on the desk title screen and the sponsor label's
  color stay in `vc.page` blocks at the end of their sheets, so they look the
  same as before.
