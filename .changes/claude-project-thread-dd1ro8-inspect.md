---
package: minor
---
- `windows/inspectCard` draws the inspect card: `unitCardTemplate`,
  `transportCardTemplate` and `refusalCardTemplate`, with `statusText`,
  `occupantsText` and `loadLines` for the lines a game words itself.
- `windows/inspectPanel` shows the card: `InspectPanel` renders, pins and
  hides it in the game's `#inspector` element, and `InspectController`
  picks the card for a pick and keeps a closed card closed.
- `RenderFacility` gains an optional `ownHousehold`, which the room card
  reads to count a household against its own size.
