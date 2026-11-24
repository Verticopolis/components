---
package: patch
---
- `bars/topBar` is cheaper on a status pass again: the traffic meter, the speeds
  and the buttons after them sit behind lit's `guard`, so a pass that changes
  only the clock or the funds skips them with one comparison. 2.3.0 drew each
  optional button as its own template, which made every pass slower than 2.2.0.
