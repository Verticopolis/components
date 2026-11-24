---
package: patch
---
- `DeskManager` leaves a maximized small window full size when the app window maximizes behind it;
  before, it stepped the window down below the app's menu bar at its old size.
