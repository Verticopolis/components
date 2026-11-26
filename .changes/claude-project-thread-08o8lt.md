---
package: minor
---
- `render/excalibur/TowerEngine`: the pointer hooks (`onTap`, `onActionDown`,
  `onActionMove`, `onActionUp`, `onHover`, `onLongPress`, `onSecondary`) take a
  `pick: PickAt` in place of the resolved `picked` entity. `pick()` hit-tests
  the point the event landed on the first time it is called and returns the
  same answer after, so a hover or a drag that never reads the entity no
  longer walks every transport actor on each pointer move. `PickAt` is
  exported beside `Picked`. Breaking: a hook that read `picked` calls `pick()`
  instead.
- `pickEntityAt` and `Picked` moved from `render/excalibur/towerInputCamera`
  to `render/excalibur/towerPick`, with `lazyPick` and `worldToCell`.
  `TowerEngine` still exports `Picked` and its `pickEntityAt` method.
