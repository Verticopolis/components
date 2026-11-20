---
package: major
---
- Semver now covers the stable subpaths: `windows/*`, `styles.css`,
  `styles/*`, `model/*`, `render/renderModel` and `render/towerSource`. The
  rest of `render/*` (the scene in `render/excalibur/*` included),
  `presentation/*` and `audio/*` are internal: a game may import them pinned
  to an exact version, but they can change in a minor version (README, "Use
  it").
