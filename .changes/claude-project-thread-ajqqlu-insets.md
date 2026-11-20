---
package: patch
---
- `styles/game/desk-pocket.css`: on a touchscreen the desk area now keeps in from the left and
  right safe-area insets as well as the top, so on a page with `viewport-fit=cover` the pocket
  desk's Tools column and tower no longer sit under a phone's notch. Nothing moves on a page
  without it.
