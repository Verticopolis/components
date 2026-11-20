---
package: major
---
- every stylesheet puts its rules in a cascade layer under `vc`
  (`@layer vc.tokens, vc.base, vc.components, vc.page;`), and each
  component's sheet in its own layer inside `vc.components`. A page's own
  unlayered CSS now beats every components rule whatever its specificity and
  wherever the bundler puts it; a `!important` inside a `vc` layer beats an
  unlayered one. A page that layers its own CSS orders it against `vc`
  (README, "Cascade layers"). The game's stylesheet keeps every rule's
  winner, so the game draws the same. On a page that loads `retro-page.css`
  in a dark OS theme, the dark teal ground now applies only when no color
  scheme is set (`html[data-scheme]`), so Skyline and High Contrast keep their
  own ground; the components gallery, which never showed the dark ground
  before, now shows it in Standard, as the game's own standalone pages do.
