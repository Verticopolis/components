---
package: minor
---
- `windows/screenSaver/*` is the screen saver. `skyScenes` (Skyline Starfield, Express
  Elevators, Bulletin Marquee) and `towerScenes` (Night Shift from a `TowerSnapshot`, Endless
  Tower) are its scenes over `saverScene`'s `SaverScene`. `screenSaver` puts one up over the
  whole page (`showScreenSaver({ makeScene, still, onEnd, hint })`, which keeps the input that
  ends it from the page) or drives one on a canvas (`runScene`). `saverTriggers`'
  `watchForSaver` starts it after a paused, untouched wait or on the way back to the tab.
  `saverPrefs` holds the choices (`loadSaverPrefs(key, touchScreen)`,
  `saveSaverPrefs(key, prefs)`). `saverDialog`'s `openScreenSaverDialog(shell, start, ports,
  { waitCaption, note })` is the Screen Saver dialog in a `ModalShell`; its OK and Cancel carry
  `data-act`.
