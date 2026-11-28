---
package: minor
---
- `render3d/Tower3dView` (draft prototype for the 5.x Tower in 3D view): draws
  the tower from the render model as a 3D model to orbit and zoom, in merged
  bands of 8 floors with instanced cars and people, three quality tiers and
  day, dusk and night lighting. It adds `three` 0.187.0 as a dependency, which
  a game loads only when it imports this subpath.
