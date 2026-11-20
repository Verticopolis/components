---
package: patch
---
- On a phone held sideways, the Getting Started card no longer covers the top
  bar. Its top follows the bar's bottom edge (CSS anchor positioning), so it
  clears the bar however many lines the bar wraps to. A browser without
  anchoring uses a top measured for each width tier. The card used to sit
  21px over the stat chips from 540 to 819px wide.
