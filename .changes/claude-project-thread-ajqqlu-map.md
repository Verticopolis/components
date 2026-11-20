---
package: minor
---
- `windows/overviewMapWindow` exports `OverviewMapWindow`, the Map window a game docks in its stage: the
  tower small with a box where the main view is, its Map button, drags, taps and keys that move the view,
  the open or closed choice per layout, and a summary a screen reader hears. It draws from one lit template
  and draws again only when something it shows changed.
- `windows/overviewMapViews` exports `OverviewMapViews`, the View dropdown and the Hotel, Eval, Pricing,
  Traffic and Occupancy views with their legends, fed by readers the game hands in (rooms, clock, tiers,
  heat cells).
- The modules they are built from come along: `overviewMapDom`, `overviewMapPresses`, `overviewMapKeys`,
  `overviewMapPicker`, `overviewMapLegend`, `overviewMapPrefs`, `overviewMapSpot`, `overviewMapPick`,
  `overviewMapText`, `overviewMapWorldPress` and `overviewMapDeps`. These are internal for now (README).
