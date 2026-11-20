---
package: minor
---
- `windows/fileDialog/fileDialog` is the Open and Save As windows: `showFileDialog(shell, ctx)` opens one
  in a `ModalShell` over a folder the caller lists, with sortable columns, a File name box, a type list,
  Rename, Duplicate, Delete, Copy and Paste, a row menu on a right-click or a held finger, a question
  before replacing or deleting, files dropped to add, From a folder…, and a linked folder on the
  player's computer where the caller offers one. The caller names its files (`words`, `kinds`,
  `saveKind`) and its name rules (`cleanName`, `freeName`, `nameMax`), and runs every command.
- `windows/fileDialog/versionsDialog` is Previous Versions (`showVersionsDialog`), which can put the
  window it was opened from back as the player left it.
- `windows/fileDialog/fileIcons` draws the 16-pixel file icons (`fileIcon(mark)` with `towerMark`,
  `oldTowerMark` and `clockMark`, the folder icons and the warning sign).
- `styles/game/file-dialog.css` now sizes the windows from their own markup inside the modal box.
