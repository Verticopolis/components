---
package: minor
---
- `windows/titleScreen/titleScreen` draws the game's title screen: `titleScreenTemplate(view)`
  takes the premise, the buttons (`TitleAction`), the small print and the optional mute,
  install and sponsor corners, and `titleSceneTemplate` and `wordmarkTemplate` draw the sky and
  the wordmark on their own. `windows/titleScreen/titleSkyline` holds the skyline's shapes. It
  imports `styles/game/splash.css`.
