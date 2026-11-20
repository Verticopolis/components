---
package: minor
---
- `windows/messageBox` is the message box as a view for `ModalShell`: `messageBoxView({ title,
  icon, iconSize, text, buttons })` draws an optional icon before the title, one paragraph or
  several, and the buttons in the footer strip, each with its own `onPress` (and `primary`,
  `act` for `data-act`, `autofocus`). `messageBoxTemplate` is the body alone and
  `messageActionsTemplate` the button row alone, for a dialog with a body of its own.
