---
package: minor
---
- `audio/Audio`: `AudioEngine` gains `musicTime` (how far into its loop the
  music is) and `continueMusic(seconds, asOf)`, which carries a track on from
  the beat another page handed over, once the player can hear it. A page that
  opens as another playing the same theme goes away keeps the tune going
  instead of starting it again.
