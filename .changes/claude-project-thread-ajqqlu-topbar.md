---
package: minor
---
- `windows/bars/topBar` and `windows/bars/statusBar` are the game's Information bar and status bar
  as lit templates. `topBarTemplate(view, actions)` draws the badge, the six meters and the speed,
  Undo, Redo, Save, sound, Update and Install buttons; `statusBarTemplate(view)` draws the hint, the
  tool card, the tower and the bulletin line. A game renders them into its own `#topbar` and
  `#statusbar` elements on each status pass, the ids and classes stay as the stylesheets name them,
  and a class the game adds itself (the Play nudge) survives a render.
- The gallery has an Information bar and status bar page, drawn in a frame over the game's desktop
  stylesheet.
