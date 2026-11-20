---
package: minor
---
- `astro/TitleBar.astro` and `astro/TitleScreen.astro` are the docs title bar and title screen
  as Astro components, for a Starlight site's `Header` and `Hero` overrides. They take
  everything they show as props and read nothing from Starlight. The package lists the
  `astro-component` keyword so Astro compiles them from `node_modules`.
- The build writes `styles/splash-skyline.svg`, the title screen's skyline as an image, and
  `styles/starlight-theme.css` tiles it from beside itself, so a docs site no longer serves its
  own `/splash-skyline.svg`. The theme also styles the wordmark's ™ (`.ts-word .tm`).
