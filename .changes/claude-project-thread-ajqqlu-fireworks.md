---
package: minor
---
- `windows/fireworks` exports `playFireworks`, pixel fireworks drawn first
  inside a dialog the caller names, under its box and over its backdrop. The
  show clears on its own, returns `stop`, and draws one still frame with
  reduced motion. The sky's steps (`newSky`, `stepSky`, `stillSky`,
  `drawSky`, `skyDone`) are exported too.
- `windows/notFoundDesk` exports `notFoundDeskTemplate`, the "page not found"
  desk for a site's 404 page: a message box on the 1994 desk with a skyline
  missing a floor and a taskbar. The site gives the words and the links, and
  each link hears a click and a middle click. `trayClock` and
  `msToNextMinute` keep its clock on the minute.
