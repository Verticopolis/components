---
package: major
---
- `windows/uiModal` draws the modal with lit. `ModalShell(dialog, { gameStopped, toast })`
  takes the shared `<dialog>`; `open({ title, body }, opts)` draws the window grammar
  (the box, the title bar with its title span and ✕, the notice line, the body), opens
  the dialog and returns its box, `render(view)` redraws an open dialog in place,
  `close()` clears it, and `say(text, again, kind)` puts a notice under the title, holds
  it for the next dialog mid-replace, or toasts. `noticeTemplate(text, kind)` is the
  notice line on its own.
- Removed: `finishModal` and `ModalDeps` from `windows/uiModal`, and `routeNotice`,
  `mountNotice` and `ModalPrecedence.drainNotice` from the precedence module. A caller
  builds its body as a lit template and hands it to `ModalShell.open` instead of
  building the box itself. `ModalPrecedence.takeNotice()` hands back a held notice
  (`{ text, kind }` or null) for the shell to draw.
