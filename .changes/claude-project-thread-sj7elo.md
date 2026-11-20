---
package: patch
---
- the renderer's context-loss handler stops the Excalibur engine
  with its public `stop()`, which also stops the texture collector and pauses
  the browser listeners, instead of stopping only the clock. The rebuild's
  teardown (`render/excalibur/engineTeardown`) still stops the collector for
  a context lost while the screen saver held the frames, and a test against
  the real Excalibur now fails if an upgrade moves that private field.
